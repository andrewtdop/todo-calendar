import { TFile } from "obsidian";
import type { App, CachedMetadata, EventRef } from "obsidian";
import { tasksStore } from "./store";
import type { Task } from "./store";
import { parseFileContent } from "./parser";

export interface IndexScope {
  includeFolders: string[];
  excludeFolders: string[];
}

function inFolder(path: string, folder: string): boolean {
  const f = folder.replace(/^\/+|\/+$/g, "");
  return f === "" || path === f || path.startsWith(f + "/");
}

export function parseFolderList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((s) => s.trim().replace(/^\/+|\/+$/g, ""))
    .filter((s) => s.length > 0);
}

/**
 * Keeps an in-memory index of every task in the vault (restricted to the configured folders)
 * and publishes it to `tasksStore`. Files are re-parsed individually as they change.
 */
export class TaskIndex {
  private byFile = new Map<string, Task[]>();
  private scanToken = 0;

  constructor(private app: App, private getScope: () => IndexScope) {}

  start(register: (ref: EventRef) => void): void {
    const { vault, metadataCache } = this.app;

    register(
      metadataCache.on("changed", (file, data, cache) => {
        if (!this.inScope(file)) return;
        this.setFile(file.path, parseFileContent(file.path, data, cache));
      }),
    );
    register(
      vault.on("delete", (file) => {
        if (this.byFile.delete(file.path)) this.publish();
      }),
    );
    register(
      vault.on("rename", (file, oldPath) => {
        const had = this.byFile.delete(oldPath);
        if (file instanceof TFile && this.inScope(file)) void this.indexFile(file);
        else if (had) this.publish();
      }),
    );

    void this.rebuild();
  }

  inScope(file: TFile): boolean {
    if (file.extension !== "md") return false;
    const { includeFolders, excludeFolders } = this.getScope();
    if (excludeFolders.some((f) => inFolder(file.path, f))) return false;
    return includeFolders.length === 0 || includeFolders.some((f) => inFolder(file.path, f));
  }

  async rebuild(): Promise<void> {
    const token = ++this.scanToken;
    const next = new Map<string, Task[]>();
    for (const file of this.app.vault.getMarkdownFiles()) {
      if (!this.inScope(file)) continue;
      const cache = this.app.metadataCache.getFileCache(file);
      if (cache && !cache.listItems?.some((li) => li.task !== undefined)) continue;
      const tasks = await this.readFile(file, cache);
      if (token !== this.scanToken) return; // a newer rebuild superseded this one
      if (tasks.length) next.set(file.path, tasks);
    }
    this.byFile = next;
    this.publish();
  }

  private async readFile(file: TFile, cache: CachedMetadata | null): Promise<Task[]> {
    try {
      const content = await this.app.vault.cachedRead(file);
      return parseFileContent(file.path, content, cache);
    } catch (e) {
      console.error(`Todo Calendar: failed to read ${file.path}`, e);
      return [];
    }
  }

  private async indexFile(file: TFile): Promise<void> {
    this.setFile(file.path, await this.readFile(file, this.app.metadataCache.getFileCache(file)));
  }

  private setFile(path: string, tasks: Task[]): void {
    const had = this.byFile.has(path);
    if (tasks.length) this.byFile.set(path, tasks);
    else this.byFile.delete(path);
    if (tasks.length || had) this.publish();
  }

  private publish(): void {
    const all: Task[] = [];
    for (const tasks of this.byFile.values()) all.push(...tasks);
    all.sort(
      (a, b) =>
        (a.date ?? "9999").localeCompare(b.date ?? "9999") ||
        a.filePath.localeCompare(b.filePath) ||
        a.line - b.line,
    );
    tasksStore.set(all);
  }
}
