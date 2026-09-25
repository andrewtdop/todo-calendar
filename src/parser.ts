import { App, Notice, TFile, normalizePath } from "obsidian";
import type { CachedMetadata } from "obsidian";
import type { Task } from "./store";
import { formatNewTask, parseTaskLine, setTaskDate, toggleTaskLine } from "./task-format";

const FENCE_REGEX = /^\s*(?:>\s*)*(```|~~~)/;

/**
 * Parse every task in a file's content.
 * When metadata is available its list items are used to locate task lines, so tasks
 * inside code blocks or front matter are ignored exactly as Obsidian ignores them.
 */
export function parseFileContent(filePath: string, content: string, cache: CachedMetadata | null): Task[] {
  const lines = content.split(/\r?\n/);
  const isKanban = cache?.frontmatter?.["kanban-plugin"] !== undefined || /^---[\s\S]*?\nkanban-plugin:/.test(content);

  let candidateLines: Iterable<number>;
  if (cache?.listItems) {
    candidateLines = cache.listItems.filter((li) => li.task !== undefined).map((li) => li.position.start.line);
  } else {
    const found: number[] = [];
    let inFence = false;
    const fmEnd = cache?.frontmatterPosition?.end.line ?? -1;
    for (let i = fmEnd + 1; i < lines.length; i++) {
      if (FENCE_REGEX.test(lines[i])) inFence = !inFence;
      else if (!inFence) found.push(i);
    }
    candidateLines = found;
  }

  // Kanban boards keep archived cards below a "***" separator.
  const archiveStart = isKanban ? lines.findIndex((l) => l.trim() === "***") : -1;

  const tasks: Task[] = [];
  for (const i of candidateLines) {
    if (archiveStart >= 0 && i > archiveStart) continue;
    const line = lines[i];
    if (line === undefined) continue;
    const p = parseTaskLine(line);
    if (!p) continue;
    tasks.push({
      id: `${filePath}:${i}`,
      text: p.text,
      completed: p.completed,
      date: p.date,
      line: i,
      originalText: line,
      filePath,
      recurrence: p.recurrence,
      start: p.start,
    });
  }
  return tasks;
}

export function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Rewrite a single task line atomically. The line is located by its index and verified
 * against the text we parsed; if the file changed underneath us we fall back to searching
 * for the exact original line, and abort if it can no longer be found.
 */
async function rewriteTask(app: App, task: Task, transform: (line: string) => string | null): Promise<void> {
  const file = app.vault.getAbstractFileByPath(task.filePath);
  if (!(file instanceof TFile)) {
    throw new Error(`File ${task.filePath} not found`);
  }

  let stale = false;
  await app.vault.process(file, (data) => {
    const eol = data.includes("\r\n") ? "\r\n" : "\n";
    const lines = data.split(/\r?\n/);
    let idx = task.line;
    if (lines[idx] !== task.originalText) idx = lines.indexOf(task.originalText);
    if (idx < 0) {
      stale = true;
      return data;
    }
    const replacement = transform(lines[idx]);
    if (replacement === null) lines.splice(idx, 1);
    else lines.splice(idx, 1, ...replacement.split("\n"));
    return lines.join(eol);
  });

  if (stale) {
    new Notice(`Todo Calendar: task "${task.text}" changed on disk, please try again.`);
  }
}

interface TasksApiV1 {
  executeToggleTaskDoneCommand?: (line: string, path: string) => string;
}

function getTasksApi(app: App): TasksApiV1 | null {
  const plugins = (app as unknown as { plugins?: { plugins?: Record<string, { apiV1?: TasksApiV1 }> } }).plugins;
  return plugins?.plugins?.["obsidian-tasks-plugin"]?.apiV1 ?? null;
}

/**
 * Toggle a task's completion. Delegates to the Tasks plugin when it is installed so done
 * dates and recurring tasks behave exactly as they do inside Obsidian; otherwise uses the
 * built-in implementation.
 */
export async function toggleTask(app: App, task: Task): Promise<void> {
  const api = getTasksApi(app);
  await rewriteTask(app, task, (line) => {
    if (api?.executeToggleTaskDoneCommand) {
      try {
        const result = api.executeToggleTaskDoneCommand(line, task.filePath);
        if (typeof result === "string" && result !== line) return result;
      } catch (e) {
        console.error("Todo Calendar: Tasks plugin toggle failed, using built-in toggle", e);
      }
    }
    return toggleTaskLine(line, todayString());
  });
}

export async function changeTaskDate(app: App, task: Task, date: string): Promise<void> {
  await rewriteTask(app, task, (line) => setTaskDate(line, date));
}

export async function deleteTask(app: App, task: Task): Promise<void> {
  await rewriteTask(app, task, () => null);
}

export async function addTask(app: App, filePath: string, text: string, date: string | null): Promise<void> {
  const path = normalizePath(filePath);
  const newLine = formatNewTask(text, date);
  const file = app.vault.getAbstractFileByPath(path);
  if (!(file instanceof TFile)) {
    await app.vault.create(path, newLine + "\n");
    return;
  }

  await app.vault.process(file, (content) => {
    let newContent = content;
    if (newContent.length > 0 && !newContent.endsWith("\n")) newContent += "\n";
    return newContent + newLine + "\n";
  });
}
