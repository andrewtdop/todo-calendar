<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { Task } from "../store";
  import { showCompletedStore } from "../store";
  import TaskItem from "./TaskItem.svelte";
  import { t } from "../i18n";

  export let tasks: Task[] = [];

  const dispatch = createEventDispatcher();

  let showNoDeadlineInput = false;
  let newNoDeadlineText = "";

  $: undatedTasks = tasks.filter(
    (t) => t.date === null && ($showCompletedStore || !t.completed),
  );

  function handleUpdate(event: CustomEvent) {
    dispatch("updateTask", event.detail);
  }

  function handleDelete(event: CustomEvent) {
    dispatch("deleteTask", event.detail);
  }

  function handleAddNoDeadline() {
    if (newNoDeadlineText.trim()) {
      dispatch("addTask", { text: newNoDeadlineText, date: null });
      newNoDeadlineText = "";
      showNoDeadlineInput = false;
    }
  }

  function cancelInput() {
    showNoDeadlineInput = false;
    newNoDeadlineText = "";
  }
</script>

<div class="control-panel no-deadline-panel">
  <div class="panel-header">
    <h3>{$t.no_deadline_tasks}</h3>
  </div>

  <div class="task-list">
    {#if undatedTasks.length === 0}
      <p class="no-tasks-msg">{$t.no_undated_tasks}</p>
    {:else}
      {#each undatedTasks as task (task.id)}
        <TaskItem {task} on:update={handleUpdate} on:delete={handleDelete} />
      {/each}
    {/if}
  </div>

  {#if showNoDeadlineInput}
    <div class="add-task-form">
      <input
        type="text"
        bind:value={newNoDeadlineText}
        placeholder={$t.add_no_deadline_task}
        on:keydown={(e) => e.key === "Enter" && handleAddNoDeadline()}
      />
      <button
        on:click={handleAddNoDeadline}
        disabled={!newNoDeadlineText.trim()}>{$t.add}</button
      >
      <button
        class="cancel-btn"
        on:click={cancelInput}
        aria-label="Cancel input">✕</button
      >
    </div>
  {:else}
    <button
      class="add-no-deadline-btn"
      on:click={() => (showNoDeadlineInput = true)}
    >
      {$t.add_no_deadline_btn}
    </button>
  {/if}
</div>

<style>
  .control-panel {
    background: var(--background-primary);
    border-radius: 8px;
    padding: 1rem;
    border: 1px solid var(--background-modifier-border);
    margin-top: 1rem;
  }
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
  .task-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
    max-height: 300px;
    overflow-y: auto;
  }
  .no-tasks-msg {
    color: var(--text-muted);
    font-style: italic;
    text-align: center;
    padding: 1rem 0;
    margin: 0;
  }
  .add-task-form {
    display: flex;
    gap: 0.5rem;
    align-items: center;
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
  .cancel-btn {
    background: none !important;
    border: none !important;
    color: var(--text-muted) !important;
    padding: 4px 8px !important;
    font-size: 1.2em;
  }
  .cancel-btn:hover {
    color: var(--text-normal) !important;
    background: var(--background-modifier-hover) !important;
  }
  .add-no-deadline-btn {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border: none;
    padding: 8px;
    border-radius: 4px;
    cursor: pointer;
    width: 100%;
    margin-top: 0.5rem;
    transition: all 0.2s ease-in-out;
  }
  .add-no-deadline-btn:hover {
    opacity: 0.9;
  }
</style>
