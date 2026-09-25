# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.1.0 - 2026-09-25

### Added
- Support for [Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) plugin emoji dates:
  `📅` due, `⏳` scheduled, `🛫` start, `✅` done, `❌` cancelled and `🔁` recurrence.
  The calendar date is the due date, falling back to the scheduled date.
- Support for [Kanban](https://github.com/mgmeyers/obsidian-kanban) boards: cards and their
  `@{YYYY-MM-DD}` dates are read; archived cards are ignored.
- Vault-wide task scanning, updated incrementally as notes change, with new
  **Include folders** and **Exclude folders** settings.
- **Show completed** toggle on the calendar (remembered between sessions).
- Checking off a task delegates to the Tasks plugin when installed, so `✅` done dates and
  recurring tasks behave exactly as in Tasks. Without it, a built-in fallback adds the done
  date and creates the next occurrence for common recurrence rules.
- Task rows show their source note and open it at the task's line when clicked.

### Changed
- Completed and cancelled tasks are hidden from the calendar and date list by default.
- Editing a task from the calendar now changes only the checkbox or date, preserving all
  other metadata (start dates, recurrence, priorities, tags, block IDs).
- New tasks are written in Tasks emoji format (`- [ ] Text 📅 YYYY-MM-DD`).
- The **Target file** setting is now the **Inbox file**: it receives new tasks, and its
  undated tasks populate the **No Deadline Tasks** panel. It is created automatically if missing.

### Removed
- The first-run "create or select a file" welcome screen, which is no longer needed now that
  tasks are read from the whole vault.

### Compatibility
- The legacy `- [ ] Task @ YYYY-MM-DD` and `@ none` syntax is still read and edited in place.

## 1.0.1 and earlier

Initial releases of the single-file todo calendar.
