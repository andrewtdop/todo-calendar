<script lang="ts">
  import { createEventDispatcher, getContext } from 'svelte';
  import type { Task } from '../store';
  import { t } from '../i18n';

  export let task: Task;

  const dispatch = createEventDispatcher();
  const openTask = getContext<((task: Task) => void) | undefined>('openTask');

  $: fileName = task.filePath.split('/').pop()?.replace(/\.md$/, '') ?? '';

  function toggleComplete() {
    dispatch('update', {
      task,
      completed: !task.completed,
      date: task.date
    });
  }

  function changeDate(e: Event) {
    const input = e.target as HTMLInputElement;
    if(input.value) {
      dispatch('update', {
        task,
        completed: task.completed,
        date: input.value
      });
    }
  }

  let showConfirmDelete = false;

  function confirmDelete() {
    dispatch('delete', { task });
    showConfirmDelete = false;
  }
</script>

<div class="task-item" class:completed={task.completed}>
  <input 
    type="checkbox" 
    checked={task.completed} 
    on:change={toggleComplete}
    class="task-checkbox"
  />
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
  <span class="task-text" title={$t.open_in_note} on:click={() => openTask?.(task)}>
    {task.text}
    {#if task.recurrence}<span class="task-recurrence" title={task.recurrence}>🔁</span>{/if}
    <span class="task-source" title={task.filePath}>{fileName}</span>
  </span>
  <input 
    type="date" 
    value={task.date ?? ''} 
    on:change={changeDate}
    class="task-date"
  />
  {#if showConfirmDelete}
    <div class="confirm-actions">
      <span class="confirm-text">{$t.delete_prompt}</span>
      <button class="confirm-btn yes" on:click={confirmDelete}>{$t.yes}</button>
      <button class="confirm-btn no" on:click={() => showConfirmDelete = false}>{$t.no}</button>
    </div>
  {:else}
    <button class="delete-btn" on:click={() => showConfirmDelete = true} aria-label="Delete task">
      ✕
    </button>
  {/if}
</div>

<style>
  .task-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: var(--background-secondary-alt);
    border-radius: 4px;
    border: 1px solid var(--background-modifier-border);
    transition: opacity 0.2s;
  }
  
  .task-item.completed {
    opacity: 0.6;
  }
  
  .task-item.completed .task-text {
    text-decoration: line-through;
    color: var(--text-muted);
  }
  
  .task-text {
    flex-grow: 1;
    font-size: 0.95em;
    cursor: pointer;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .task-text:hover {
    color: var(--text-accent);
  }

  .task-recurrence {
    font-size: 0.8em;
    margin-left: 0.25rem;
  }

  .task-source {
    display: block;
    font-size: 0.75em;
    color: var(--text-faint);
  }
  
  .task-checkbox {
    cursor: pointer;
  }
  
  .task-date {
    background: var(--background-modifier-form-field);
    color: var(--text-normal);
    border: 1px solid var(--background-modifier-border);
    border-radius: 4px;
    padding: 2px 4px;
    font-size: 0.85em;
  }

  .delete-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 1em;
  }
  .delete-btn:hover {
    color: var(--text-error);
    background: var(--background-modifier-hover);
  }

  .confirm-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.85em;
  }
  .confirm-text {
    color: var(--text-error);
    margin-right: 4px;
    font-weight: bold;
  }
  .confirm-btn {
    background: var(--background-modifier-form-field);
    border: 1px solid var(--background-modifier-border);
    color: var(--text-normal);
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 4px;
  }
  .confirm-btn.yes {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border-color: var(--interactive-accent);
  }
  .confirm-btn:hover {
    opacity: 0.8;
  }
</style>
