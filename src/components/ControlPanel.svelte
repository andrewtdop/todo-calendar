<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { Task } from "../store";
  import { showCompletedStore } from "../store";
  import TaskItem from "./TaskItem.svelte";
  import { t } from "../i18n";

  export let tasks: Task[] = [];
  export let selectedDate: string | null = null;

  const dispatch = createEventDispatcher();

  let newTaskText = "";

  $: dayTasks = selectedDate
    ? tasks.filter(
        (t) => t.date === selectedDate && ($showCompletedStore || !t.completed),
      )
    : [];

  function handleUpdate(event: CustomEvent) {
    dispatch("updateTask", event.detail);
  }

  function handleDelete(event: CustomEvent) {
    dispatch("deleteTask", event.detail);
  }

  function handleAdd() {
    if (newTaskText.trim() && selectedDate) {
      dispatch("addTask", { text: newTaskText, date: selectedDate });
      newTaskText = "";
    }
  }
</script>

<div class="control-panel">
  {#if selectedDate}
    <div class="panel-header">
      <h3>{$t.tasks_for} {selectedDate}</h3>
      <button
        class="close-panel-btn"
        on:click={() => dispatch("close")}
        aria-label="Close panel">✕</button
      >
    </div>

    <div class="task-list">
      {#if dayTasks.length === 0}
        <p class="no-tasks-msg">{$t.no_tasks_for_day}</p>
      {:else}
        {#each dayTasks as task (task.id)}
          <TaskItem {task} on:update={handleUpdate} on:delete={handleDelete} />
        {/each}
      {/if}
    </div>

    <div class="add-task-form">
      <input
        type="text"
        bind:value={newTaskText}
        placeholder={$t.add_new_task}
        on:keydown={(e) => e.key === "Enter" && handleAdd()}
      />
      <button on:click={handleAdd} disabled={!newTaskText.trim()}
        >{$t.add}</button
      >
    </div>
  {:else}
    <div class="no-date-msg">
      <p>{$t.select_date}</p>
    </div>
  {/if}
</div>

<style>
  .panel-header {
    margin-bottom: 1rem;
    border-bottom: 1px solid var(--background-modifier-border);
    padding-bottom: 0.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .panel-header h3 {
    margin: 0;
    color: var(--text-normal);
  }
  .close-panel-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 1.2em;
    padding: 2px 8px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .close-panel-btn:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }
  .task-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
    max-height: 300px;
    overflow-y: auto;
  }
  .no-tasks-msg,
  .no-date-msg {
    color: var(--text-muted);
    font-style: italic;
    text-align: center;
    padding: 1rem 0;
    margin: 0;
  }
  .add-task-form {
    display: flex;
    gap: 0.5rem;
  }
  .add-task-form input {
    flex-grow: 1;
    background: var(--background-modifier-form-field);
    border: 1px solid var(--background-modifier-border);
    color: var(--text-normal);
    padding: 4px 8px;
    border-radius: 4px;
  }
  .add-task-form button {
    background-color: var(--interactive-accent);
    color: var(--text-on-accent);
    border: none;
    padding: 4px 12px;
    border-radius: 4px;
    cursor: pointer;
  }
  .add-task-form button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
