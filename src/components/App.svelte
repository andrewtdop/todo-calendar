<script lang="ts">
  import { setContext } from "svelte";
  import type { App as ObsidianApp } from "obsidian";
  import { tasksStore, currentFileStore, selectedDateStore } from "../store";
  import type { Task } from "../store";
  import { toggleTask, changeTaskDate, addTask, deleteTask } from "../parser";
  import Calendar from "./Calendar.svelte";
  import ControlPanel from "./ControlPanel.svelte";
  import FilterPanel from "./FilterPanel.svelte";
  import NoDeadlinePanel from "./NoDeadlinePanel.svelte";

  export let app: ObsidianApp;

  // Lets any TaskItem jump to the note (and line) the task lives in.
  setContext("openTask", (task: Task) => {
    void app.workspace.openLinkText(task.filePath, "", false, {
      eState: { line: task.line },
    });
  });

  function handleSelectDate(event: CustomEvent<string>) {
    if ($selectedDateStore === event.detail) {
      $selectedDateStore = null;
    } else {
      $selectedDateStore = event.detail;
    }
  }

  async function handleUpdateTask(
    event: CustomEvent<{ task: Task; completed: boolean; date: string | null }>,
  ) {
    const { task, completed, date } = event.detail;
    try {
      if (completed !== task.completed) {
        await toggleTask(app, task);
      } else if (date && date !== task.date) {
        await changeTaskDate(app, task, date);
      }
    } catch (e) {
      console.error("Failed to update task", e);
    }
  }

  async function handleAddTask(
    event: CustomEvent<{ text: string; date: string | null }>,
  ) {
    const { text, date } = event.detail;
    try {
      await addTask(app, $currentFileStore, text, date);
    } catch (e) {
      console.error("Failed to add task", e);
    }
  }

  async function handleDeleteTask(event: CustomEvent<{ task: Task }>) {
    try {
      await deleteTask(app, event.detail.task);
    } catch (e) {
      console.error("Failed to delete task", e);
    }
  }
</script>

<div class="todo-app-container">
  <h2>Todo Calendar</h2>

  <div class="calendar-and-control-group">
    <Calendar
      tasks={$tasksStore}
      selectedDate={$selectedDateStore}
      on:select={handleSelectDate}
    />

    <div class="divider"></div>

    <ControlPanel
      tasks={$tasksStore}
      selectedDate={$selectedDateStore}
      on:updateTask={handleUpdateTask}
      on:addTask={handleAddTask}
      on:deleteTask={handleDeleteTask}
      on:close={() => ($selectedDateStore = null)}
    />
  </div>

  <FilterPanel
    tasks={$tasksStore}
    on:updateTask={handleUpdateTask}
    on:deleteTask={handleDeleteTask}
  />

  <NoDeadlinePanel
    tasks={$tasksStore.filter((t) => t.filePath === $currentFileStore)}
    on:updateTask={handleUpdateTask}
    on:addTask={handleAddTask}
    on:deleteTask={handleDeleteTask}
  />
</div>

<style>
  .todo-app-container {
    padding: 1rem;
    height: 100%;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    position: relative;
    z-index: 0;
  }

  h2 {
    margin-top: 0;
    margin-bottom: 0.5rem;
    flex-shrink: 0;
  }

  .calendar-and-control-group {
    background: var(--background-primary);
    border-radius: 8px;
    border: 1px solid var(--background-modifier-border);
    display: flex;
    flex-direction: column;
    padding: 1rem;
    gap: 1rem;
  }

  .divider {
    height: 1px;
    background-color: var(--background-modifier-border);
    margin: 0 -1rem; /* Extend to edge to ignore padding */
  }

  :global(.calendar-container) {
    flex-shrink: 0;
    position: relative;
    z-index: 10;
  }

  :global(.control-panel) {
    flex-shrink: 0;
    position: relative;
    z-index: 5;
  }

</style>
