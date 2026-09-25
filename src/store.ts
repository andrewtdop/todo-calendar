import { writable } from "svelte/store";

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  date: string | null; // YYYY-MM-DD
  line: number; // line index in the markdown file
  originalText: string;
  filePath: string;
  recurrence: string | null;
  start: string | null;
}

export const tasksStore = writable<Task[]>([]);
/** File that new tasks are written to (the "inbox"). */
export const currentFileStore = writable<string>("todo-calendar.md");
export const selectedDateStore = writable<string | null>(null);
export const showCompletedStore = writable<boolean>(false);
