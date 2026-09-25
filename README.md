# Obsidian Todo Calendar

English | [繁體中文](README.zh-TW.md)

A visual calendar and timeline view for your Markdown to-do lists in Obsidian.

This plugin transforms your Markdown task list into an intuitive calendar and timeline interface, supporting bi-directional synchronization, internationalization, and a native Obsidian experience.

---

## 📸 Screenshots

![Welcome Screen](assets/welcome.png)
![Control Panel](assets/controlpanel.png)

---

## 🚀 Features

- **Visual Calendar**: A monthly calendar interface that clearly highlights dates with tasks and their completion status.
- **Bi-directional Sync**: Any creation, modification, deletion, or completion of tasks on the calendar panel is instantly and accurately synced to your Markdown file. Conversely, editing the file externally will update the calendar in real time.
- **Internationalization (i18n)**: Supports English and Traditional Chinese (zh-TW), which can be switched instantly in the settings.
- **Vault-wide Tasks**: Reads tasks from every note in your vault (optionally limited to or excluding specific folders), including [Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) plugin emoji dates and [Kanban](https://github.com/mgmeyers/obsidian-kanban) boards. New tasks created from the calendar go to an inbox file (`todo-calendar.md` by default).
- **Customizable Open Location**: Can be opened in the main workspace or toggled to open in the right sidebar (where backlinks normally reside).
- **Categorization & Filtering**: Built-in filter panels (overdue, next 3 days, next 7 days, etc.) and a dedicated panel for managing tasks with no deadlines.

---

## 🛠️ Usage

1. Enable the plugin and click the **Calendar icon** on the left Ribbon.
2. The calendar immediately shows tasks from across your vault. New tasks you add from the calendar are written to the inbox file (`todo-calendar.md` by default, changeable in settings).
3. **Task Formats**: Any Markdown task with a date is placed on the calendar until it is completed:
   ```markdown
   - [ ] Finish paper ready for Populism conference 📅 2025-09-15 🛫 2025-06-20
   - [ ] Pay credit cards 🔁 every month 📅 2025-08-03
   - [ ] Kanban card @{2025-07-18}
   - [ ] Buy milk @ 2026-07-18
   - [ ] Task with no deadline
   ```
   | Syntax | Source | Used as calendar date |
   | --- | --- | --- |
   | `📅 YYYY-MM-DD` | Tasks plugin (due) | Yes (first choice) |
   | `@ YYYY-MM-DD` / `@ none` | Todo Calendar (legacy) | Yes |
   | `⏳ YYYY-MM-DD` | Tasks plugin (scheduled) | If there is no due date |
   | `@{YYYY-MM-DD}` | Kanban plugin | If there is no due or scheduled date |

   Other Tasks fields (`🛫` start, `🔁` recurrence, priorities, `🆔`, block IDs, tags) are preserved when the calendar edits a line.
4. **Completing tasks**: Completed (`[x]`) and cancelled (`[-]`) tasks are hidden from the calendar; use the **Show completed** toggle to see them. When the Tasks plugin is installed, checking a task off from the calendar uses the Tasks plugin itself, so `✅` done dates and recurring tasks (`🔁`) behave exactly as they do in your notes. Without it, the calendar adds the `✅` date and creates the next occurrence of common recurrence rules (`every day/week/month/year`, `every N weeks`, `every weekday`, `every Monday`, `every month on the 3rd`, `… when done`).
5. Click a task's text to jump to the note it lives in. Archived Kanban cards are ignored.

---

## 🧑‍💻 Technical Details & Architecture

This project combines the **Obsidian API** with the **Svelte** framework, ensuring efficient UI updates and stable file I/O through bi-directional data flow.

### 1. Architecture

- `main.ts`: The entry point of the plugin. Responsible for registering the view (`ItemView`), the sidebar icon, Command Palette commands, and the settings interface (`PluginSettingTab`).
- `todo-view.ts`: The core view class that bridges Obsidian and Svelte. Upon `onOpen()`, it instantiates the Svelte app (`App.svelte`) and passes the Obsidian `App` and `Plugin` instances as props.
- `store.ts`: Uses Svelte Stores for global state management, including the task list (`tasksStore`), the currently bound file (`currentFileStore`), and the selected date (`selectedDateStore`).
- `i18n.ts`: A lightweight internationalization system based on Svelte Stores. It uses a `derived` store to automatically respond to language switches, allowing instantaneous UI text updates without reloading the plugin.
- `task-format.ts`: Pure functions that parse and rewrite a single task line (Tasks emoji fields, Kanban `@{date}`, legacy `@ date`) and compute recurring-task occurrences.
- `task-index.ts`: Keeps a vault-wide, per-file task index that is updated incrementally from Obsidian's metadata cache events.
- `parser.ts`: Parses whole files (skipping code blocks and archived Kanban cards) and performs atomic, verified line edits via `app.vault.process()`, delegating completion to the Tasks plugin API when available.

### 2. Bi-directional Sync Logic

- **From UI to File (Write)**: When the user interacts with the Svelte panel (e.g., clicking a checkbox or adding a task), events are dispatched to trigger write methods in `parser.ts`. We use `app.vault.process()` to atomically rewrite the exact task line in whichever note it lives in, after verifying the line has not changed since it was parsed.
- **From File to UI (Read)**: `TaskIndex` listens to `metadataCache.on("changed")`, `vault.on("delete")` and `vault.on("rename")`. Only the affected file is re-parsed, and the merged result is pushed to `$tasksStore`, which triggers a Svelte re-render.

### 3. Svelte CSS Scoping

This project does not rely on a massive global `styles.css`. Instead, it fully utilizes Svelte's built-in CSS scoping (Scoped CSS). 
This prevents our custom classes (like `.day-cell`) from conflicting with Obsidian's native themes or other plugins' CSS. Additionally, all colors strictly use Obsidian's native CSS Variables (e.g., `var(--interactive-accent)`), ensuring perfect integration across various light/dark modes or third-party themes.

---

## ⌨️ Local Development

If you want to contribute or run the development environment locally:

1. Clone this repository to your local machine:
   ```bash
   git clone https://github.com/your-username/obsidian-todo-calendar.git
   cd obsidian-todo-calendar
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development compiler in watch mode:
   ```bash
   npm run dev
   ```
   *Note: This will compile the Svelte components and output the final plugin files (`main.js` and `manifest.json`) into the `todo-calendar/` directory.*
4. To test the plugin in Obsidian, copy or symlink the generated `todo-calendar/` folder into your Obsidian vault's plugins folder:
   ```bash
   # macOS / Linux
   ln -s /path/to/cloned/obsidian-todo-calendar/todo-calendar /path/to/your/vault/.obsidian/plugins/todo-calendar

   # Windows (Run Command Prompt as Administrator)
   mklink /D "C:\path\to\your\vault\.obsidian\plugins\todo-calendar" "C:\path\to\cloned\obsidian-todo-calendar\todo-calendar"
   ```
5. Refresh your Obsidian plugins list and enable "Todo Calendar".

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
