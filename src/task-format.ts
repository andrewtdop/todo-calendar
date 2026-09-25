// Pure (Obsidian-free) helpers for reading and rewriting a single Markdown task line.
//
// Supported date syntaxes:
//   - Tasks plugin emoji fields: 📅 due, ⏳ scheduled, 🛫 start, ✅ done, ❌ cancelled, ➕ created, 🔁 recurrence
//   - Kanban plugin card dates:  @{YYYY-MM-DD}
//   - Legacy Todo Calendar:      @ YYYY-MM-DD  /  @ none

export type DateSource = "due" | "scheduled" | "kanban" | "legacy" | null;

export interface ParsedTaskLine {
  /** Leading indentation / blockquote / list marker, e.g. "  - " or "> - ". */
  prefix: string;
  /** The raw character inside [ ]. */
  status: string;
  /** Everything after "[x] ". */
  body: string;
  /** Human readable description with all metadata stripped. */
  text: string;
  completed: boolean;
  /** Date the calendar uses (YYYY-MM-DD) or null. */
  date: string | null;
  dateSource: DateSource;
  due: string | null;
  scheduled: string | null;
  start: string | null;
  done: string | null;
  kanbanDate: string | null;
  legacyDate: string | null;
  recurrence: string | null;
  /** True when the line uses the legacy "@ YYYY-MM-DD" / "@ none" syntax. */
  isLegacy: boolean;
}

const DATE = "(\\d{4}-\\d{2}-\\d{2})";
const VS = "\\uFE0F?"; // optional emoji variation selector

const MARKERS = {
  due: "(?:📅|📆|🗓)",
  scheduled: "(?:⏳|⌛)",
  start: "🛫",
  done: "✅",
  cancelled: "❌",
  created: "➕",
};
type DateField = keyof typeof MARKERS;

function dateFieldRegex(field: DateField, flags = ""): RegExp {
  return new RegExp(`\\s*${MARKERS[field]}${VS}\\s*${DATE}`, flags);
}

export const TASK_LINE_REGEX = /^((?:\s*>)*\s*(?:[-*+]|\d+[.)])\s+\[)(.)\](?:\s+(.*))?$/;
const KANBAN_DATE_REGEX = /\s*@\{(\d{4}-\d{2}-\d{2})\}/;
const KANBAN_TIME_REGEX = /\s*@@\{\d{1,2}:\d{2}\}/g;
const LEGACY_DATE_REGEX = /(^|\s)@ (\d{4}-\d{2}-\d{2}|none)(?=\s|$)/;
const RECURRENCE_REGEX = new RegExp(`\\s*🔁${VS}\\s*([A-Za-z0-9 ,]*[A-Za-z0-9])`);
const BLOCK_ID_REGEX = /\s+\^[A-Za-z0-9-]+\s*$/;
const STRIP_REGEXES: RegExp[] = [
  ...(Object.keys(MARKERS) as DateField[]).map((f) => dateFieldRegex(f, "g")),
  new RegExp(RECURRENCE_REGEX.source, "g"),
  new RegExp(`\\s*(?:🔺|⏫|🔼|🔽|⏬)${VS}`, "g"),
  new RegExp(`\\s*🆔${VS}\\s*[A-Za-z0-9_-]+`, "g"),
  new RegExp(`\\s*⛔${VS}\\s*[A-Za-z0-9_,-]+`, "g"),
  new RegExp(`\\s*🏁${VS}\\s*[A-Za-z]+`, "g"),
  new RegExp(KANBAN_DATE_REGEX.source, "g"),
  KANBAN_TIME_REGEX,
  new RegExp(LEGACY_DATE_REGEX.source, "g"),
  BLOCK_ID_REGEX,
];

const COMPLETED_STATUSES = new Set(["x", "X", "-"]);

function isValidDate(s: string): boolean {
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function field(body: string, f: DateField): string | null {
  const m = body.match(dateFieldRegex(f));
  return m && isValidDate(m[1]) ? m[1] : null;
}

export function parseTaskLine(line: string): ParsedTaskLine | null {
  const m = line.match(TASK_LINE_REGEX);
  if (!m) return null;
  const prefix = m[1].slice(0, -1); // drop the "["
  const status = m[2];
  const body = m[3] ?? "";

  const due = field(body, "due");
  const scheduled = field(body, "scheduled");
  const start = field(body, "start");
  const done = field(body, "done");
  const cancelled = field(body, "cancelled");

  const kanbanMatch = body.match(KANBAN_DATE_REGEX);
  const kanbanDate = kanbanMatch && isValidDate(kanbanMatch[1]) ? kanbanMatch[1] : null;

  const legacyMatch = body.match(LEGACY_DATE_REGEX);
  const isLegacy = !!legacyMatch;
  const legacyDate = legacyMatch && legacyMatch[2] !== "none" && isValidDate(legacyMatch[2]) ? legacyMatch[2] : null;

  const recurrenceMatch = body.match(RECURRENCE_REGEX);
  const recurrence = recurrenceMatch ? recurrenceMatch[1].trim() : null;

  let date: string | null = null;
  let dateSource: DateSource = null;
  if (due) [date, dateSource] = [due, "due"];
  else if (legacyDate) [date, dateSource] = [legacyDate, "legacy"];
  else if (scheduled) [date, dateSource] = [scheduled, "scheduled"];
  else if (kanbanDate) [date, dateSource] = [kanbanDate, "kanban"];

  let text = body;
  for (const re of STRIP_REGEXES) text = text.replace(re, " ");
  text = text.replace(/\s+/g, " ").trim();

  return {
    prefix,
    status,
    body,
    text,
    completed: COMPLETED_STATUSES.has(status) || !!cancelled,
    date,
    dateSource,
    due,
    scheduled,
    start,
    done,
    kanbanDate,
    legacyDate,
    recurrence,
    isLegacy,
  };
}

// ---------------------------------------------------------------------------
// Line rewriting

function buildLine(prefix: string, status: string, body: string): string {
  return `${prefix}[${status}]${body ? " " + body : ""}`;
}

/** Append a field to the body, keeping a trailing block id (^abc) at the very end. */
function appendField(body: string, fieldText: string): string {
  const blockId = body.match(BLOCK_ID_REGEX);
  if (blockId) {
    const head = body.slice(0, blockId.index).trimEnd();
    return `${head} ${fieldText}${blockId[0]}`;
  }
  return `${body.trimEnd()} ${fieldText}`.trim();
}

function replaceDateValue(body: string, re: RegExp, newDate: string): string {
  return body.replace(re, (whole, d: string) => whole.replace(d, newDate));
}

/** Change the calendar date of a task, keeping the syntax the line already uses. */
export function setTaskDate(line: string, newDate: string): string {
  const p = parseTaskLine(line);
  if (!p) return line;
  let body = p.body;
  switch (p.dateSource) {
    case "due":
      body = replaceDateValue(body, dateFieldRegex("due"), newDate);
      break;
    case "scheduled":
      body = replaceDateValue(body, dateFieldRegex("scheduled"), newDate);
      break;
    case "kanban":
      body = replaceDateValue(body, KANBAN_DATE_REGEX, newDate);
      break;
    case "legacy":
      body = body.replace(LEGACY_DATE_REGEX, `$1@ ${newDate}`);
      break;
    default:
      body = p.isLegacy ? body.replace(LEGACY_DATE_REGEX, `$1@ ${newDate}`) : appendField(body, `📅 ${newDate}`);
  }
  return buildLine(p.prefix, p.status, body);
}

export function formatNewTask(text: string, date: string | null): string {
  return date ? `- [ ] ${text.trim()} 📅 ${date}` : `- [ ] ${text.trim()}`;
}

/**
 * Built-in completion toggle (used when the Tasks plugin is not available).
 * Returns the replacement text, which may span two lines for recurring tasks
 * (next occurrence first, then the completed task — the Tasks plugin default).
 */
export function toggleTaskLine(line: string, today: string): string {
  const p = parseTaskLine(line);
  if (!p) return line;

  if (p.completed) {
    let body = p.body.replace(dateFieldRegex("done", "g"), "").replace(dateFieldRegex("cancelled", "g"), "");
    return buildLine(p.prefix, " ", body.trim());
  }

  const doneBody = p.isLegacy ? p.body : appendField(p.body, `✅ ${today}`);
  const doneLine = buildLine(p.prefix, "x", doneBody);

  if (!p.recurrence) return doneLine;
  const next = nextOccurrence(p.recurrence, p, today);
  if (!next) return doneLine;

  let nextBody = p.body.replace(BLOCK_ID_REGEX, "");
  if (p.due && next.due) nextBody = replaceDateValue(nextBody, dateFieldRegex("due"), next.due);
  if (p.scheduled && next.scheduled) nextBody = replaceDateValue(nextBody, dateFieldRegex("scheduled"), next.scheduled);
  if (p.start && next.start) nextBody = replaceDateValue(nextBody, dateFieldRegex("start"), next.start);
  if (p.kanbanDate && next.kanban) nextBody = replaceDateValue(nextBody, KANBAN_DATE_REGEX, next.kanban);
  const nextStatus = p.status === "/" ? " " : p.status;
  return `${buildLine(p.prefix, nextStatus, nextBody.trim())}\n${doneLine}`;
}

// ---------------------------------------------------------------------------
// Recurrence (subset of the Tasks plugin grammar)

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function toUTC(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86400000);
}

function addMonths(d: Date, n: number, day = d.getUTCDate()): Date {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + n;
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(day, lastDay)));
}

/** Compute the next reference date for a recurrence rule, or null if unsupported. */
export function nextDate(rule: string, from: string): string | null {
  const r = rule.toLowerCase().replace(/\s+/g, " ").trim();
  const base = toUTC(from);
  let m: RegExpMatchArray | null;

  if ((m = r.match(/^every (\d+ )?(day|week|month|year)s?$/))) {
    const n = m[1] ? parseInt(m[1]) : 1;
    switch (m[2]) {
      case "day": return fmt(addDays(base, n));
      case "week": return fmt(addDays(base, 7 * n));
      case "month": return fmt(addMonths(base, n));
      case "year": return fmt(addMonths(base, 12 * n));
    }
  }

  if (r === "every weekday") {
    let d = addDays(base, 1);
    while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d = addDays(d, 1);
    return fmt(d);
  }

  if ((m = r.match(/^every (?:week on )?((?:(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday)(?:, | and |,)?)+)$/))) {
    const days = new Set(WEEKDAYS.map((w, i) => (m![1].includes(w) ? i : -1)).filter((i) => i >= 0));
    let d = addDays(base, 1);
    for (let i = 0; i < 7 && !days.has(d.getUTCDay()); i++) d = addDays(d, 1);
    return fmt(d);
  }

  if ((m = r.match(/^every (\d+ )?months? on the (\d{1,2})(?:st|nd|rd|th)$/))) {
    const n = m[1] ? parseInt(m[1]) : 1;
    return fmt(addMonths(base, n, parseInt(m[2])));
  }

  if ((m = r.match(/^every (\d+ )?months? on the last(?: day)?$/))) {
    const n = m[1] ? parseInt(m[1]) : 1;
    return fmt(addMonths(base, n, 31));
  }

  return null;
}

interface NextDates {
  due: string | null;
  scheduled: string | null;
  start: string | null;
  kanban: string | null;
}

export function nextOccurrence(
  rule: string,
  dates: { due: string | null; scheduled: string | null; start: string | null; kanbanDate: string | null },
  today: string,
): NextDates | null {
  const whenDone = /\bwhen done$/i.test(rule.trim());
  const cleanRule = rule.replace(/\s*when done$/i, "");
  const ref = dates.due ?? dates.scheduled ?? dates.start ?? dates.kanbanDate;
  if (!ref) return null;

  const nextRef = nextDate(cleanRule, whenDone ? today : ref);
  if (!nextRef) return null;

  const delta = Math.round((toUTC(nextRef).getTime() - toUTC(ref).getTime()) / 86400000);
  const shift = (d: string | null) => (d ? fmt(addDays(toUTC(d), delta)) : null);
  // The reference date itself uses the exact computed value (avoids month-length drift).
  return {
    due: dates.due ? (ref === dates.due ? nextRef : shift(dates.due)) : null,
    scheduled: dates.scheduled ? (ref === dates.scheduled && !dates.due ? nextRef : shift(dates.scheduled)) : null,
    start: dates.start ? shift(dates.start) : null,
    kanban: dates.kanbanDate ? shift(dates.kanbanDate) : null,
  };
}
