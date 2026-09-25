<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { Task } from "../store";
  import { t } from "../i18n";

  export let tasks: Task[] = [];
  export let selectedDate: string | null = null;

  const dispatch = createEventDispatcher();

  let currentDate = new Date();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  $: currentYear = currentDate.getFullYear();
  $: currentMonth = currentDate.getMonth();

  function prevMonth() {
    currentDate = new Date(currentYear, currentMonth - 1, 1);
  }

  function nextMonth() {
    currentDate = new Date(currentYear, currentMonth + 1, 1);
  }

  function selectDate(dateStr: string) {
    dispatch("select", dateStr);
  }

  // Get calendar grid
  $: calendarDays = (() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startingDayOfWeek = firstDay.getDay(); // 0 is Sunday
    const totalDays = lastDay.getDate();

    const days = [];

    // Previous month padding
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        dateStr: "",
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const monthStr = String(currentMonth + 1).padStart(2, "0");
      const dayStr = String(i).padStart(2, "0");
      days.push({
        day: i,
        isCurrentMonth: true,
        dateStr: `${currentYear}-${monthStr}-${dayStr}`,
      });
    }

    // Next month padding to fill 6 rows (42 cells)
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({ day: i, isCurrentMonth: false, dateStr: "" });
    }

    return days;
  })();

  function getTaskStatusClass(dateStr: string, currentTasks: Task[]) {
    if (!dateStr) return "";
    const dayTasks = currentTasks.filter((t) => t.date === dateStr);
    if (dayTasks.length === 0) return "";

    const allCompleted = dayTasks.every((t) => t.completed);
    return allCompleted ? "status-completed" : "status-pending";
  }
</script>

<div class="calendar-container">
  <div class="header">
    <button on:click={prevMonth}>&lt;</button>
    <h3>{$t.months[currentMonth]} {currentYear}</h3>
    <button on:click={nextMonth}>&gt;</button>
  </div>

  <div class="timeline-weekdays">
    {#each $t.weekdays as weekday}
      <div>{weekday}</div>
    {/each}
  </div>

  <div class="timeline-days-grid">
    {#each calendarDays as { day, isCurrentMonth, dateStr }}
      <button
        class="day-cell {isCurrentMonth
          ? 'current-month'
          : 'other-month'} {dateStr === todayStr ? 'today' : ''} {dateStr ===
        selectedDate
          ? 'selected'
          : ''} {getTaskStatusClass(dateStr, tasks)}"
        on:click={() => isCurrentMonth && selectDate(dateStr)}
      >
        <span class="day-number">{day}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  .header h3 {
    margin: 0;
  }
  .timeline-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    width: 100%;
    margin-bottom: 0.5rem;
    color: var(--text-muted);
    font-weight: bold;
  }
  .timeline-weekdays div {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .timeline-days-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    width: 100%;
  }
  .day-cell {
    width: 100%;
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    cursor: pointer;
    position: relative;
    background-color: transparent !important;
    background-image: none !important;
    box-shadow: none !important;
    border: 2px solid transparent !important;
    padding: 0;
    color: var(--text-normal);
    font-size: 1em;
    overflow: hidden;
  }
  .day-cell > * {
    z-index: 1;
    position: relative;
  }
  .day-cell.current-month:hover {
    background-color: var(--background-modifier-hover) !important;
  }
  .day-cell.other-month {
    color: var(--text-faint);
    cursor: default;
  }
  .day-cell.today::before {
    content: "";
    position: absolute;
    inset: 0;
    background-color: var(--interactive-accent);
    opacity: 0.25;
    z-index: 0;
  }
  .day-cell.selected {
    border-color: var(--interactive-accent) !important;
  }
  .day-cell.status-pending::after {
    content: "";
    position: absolute;
    top: 4px;
    right: 4px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: var(--interactive-accent);
    z-index: 2;
  }
  .day-cell.status-completed::after {
    content: "";
    position: absolute;
    top: 4px;
    right: 4px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: var(--text-success);
    z-index: 2;
  }
</style>
