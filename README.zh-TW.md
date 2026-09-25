# Obsidian Todo Calendar

[Read in English](README.md) | 繁體中文

這個插件可以將你的 Markdown 任務清單轉化為一個直觀的日曆與時間軸介面，支援雙向同步、多國語言，並且提供原生的操作體驗。

---

## 📸 介面預覽

![歡迎畫面](assets/welcome-zh-TW.png)
![面板](assets/controlpanel-zh-TW.png)

---

## 🚀 核心功能

- **視覺化日曆**：以月為單位的日曆介面，清楚標示含有待辦事項的日期與完成狀態。
- **雙向同步 (Bi-directional Sync)**：在日曆面板上的新增、修改、刪除、打勾，會即時且精準地同步到你的 Markdown 檔案中。反之，在外部修改檔案，日曆也會即時更新。
- **多國語言 (i18n)**：支援英文 (English) 與繁體中文 (zh-TW)，且可於設定中即時切換。
- **全庫任務**：從整個筆記庫讀取待辦事項（可限定或排除特定資料夾），支援 Tasks 插件的 emoji 日期與 Kanban 看板。從月曆新增的事項會寫入收件匣檔案（預設為 `todo-calendar.md`）。
- **自訂開啟位置**：可設定在主畫面中央開啟，或是像側邊欄大綱一樣於右側邊欄抽拉開啟。
- **分類與過濾**：內建篩選面板（逾期、未來 3 天、未來 7 天等），並提供專屬的「無期限事項」管理面板。

---

## 🛠️ 使用方式

1. 開啟插件後，點擊左側 Ribbon 上的**日曆圖示**。
2. 月曆會直接顯示整個筆記庫中的待辦事項。從月曆新增的事項會寫入收件匣檔案（預設為 `todo-calendar.md`，可在設定中變更）。
3. **任務格式**：任何帶有日期的 Markdown 任務都會顯示在月曆上，直到完成為止：
   ```markdown
   - [ ] Tasks 插件截止日 📅 2025-09-15 🛫 2025-06-20
   - [ ] 每月繳卡費 🔁 every month 📅 2025-08-03
   - [ ] Kanban 卡片 @{2025-07-18}
   - [ ] 買牛奶 @ 2026-07-18
   - [ ] 沒有期限的任務
   ```
   日期優先順序：`📅`（截止日）／`@ YYYY-MM-DD` → `⏳`（排程日）→ Kanban `@{YYYY-MM-DD}`。其他 Tasks 欄位（`🛫`、`🔁`、優先度、區塊 ID、標籤）在編輯時都會保留。
4. **完成任務**：已完成與已取消的任務預設會從月曆隱藏，可用「顯示已完成」切換。若已安裝 Tasks 插件，勾選完成時會交由 Tasks 插件處理，`✅` 完成日期與重複任務（`🔁`）的行為與筆記中完全一致；否則由本插件自行加上完成日期並產生常見重複規則的下一次任務。
5. 點擊任務文字即可跳到該任務所在的筆記。Kanban 已封存的卡片會被忽略。

---

## 🧑‍💻 技術細節與架構

本專案結合了 **Obsidian API** 與 **Svelte** 框架，透過雙向資料流確保高效的 UI 更新與穩定的檔案讀寫。

### 1. 專案架構

- `main.ts`: 插件的進入點。負責註冊視圖 (`ItemView`)、側邊欄 Icon、Command Palette 指令以及設定介面 (`PluginSettingTab`)。
- `todo-view.ts`: 橋接 Obsidian 與 Svelte 的核心視圖類別。它在 `onOpen()` 時實例化 Svelte 應用 (`App.svelte`) 並將 Obsidian 的 `App` 與 `Plugin` 實例作為 props 傳遞給 Svelte。
- `store.ts`: 使用 Svelte Store 統一管理全域狀態，包括任務清單 (`tasksStore`)、當前綁定檔案 (`currentFileStore`) 以及目前選取的日期 (`selectedDateStore`)。
- `i18n.ts`: 基於 Svelte Store 實作的輕量多國語言系統，運用 `derived` store 自動響應語言切換，無需重新載入插件即可即時更新全 UI 的文字。
- `parser.ts`: 處理所有 Obsidian Vault 的讀寫邏輯，利用正則表達式解析與精準修改 Markdown 文件的特定行數。

### 2. 雙向同步實作邏輯

- **從 UI 到檔案 (Write)**：當使用者在 Svelte 面板中進行操作（如點擊 checkbox 或新增任務），事件會向外拋出並呼叫 `parser.ts` 中的寫入方法。我們使用 `app.vault.process()` 或直接讀寫特定 `line` 的內容來修改實體 Markdown 檔案。
- **從檔案到 UI (Read)**：在 `App.svelte` 中，我們透過監聽 Obsidian 的 `app.vault.on("modify", ...)` 事件來捕捉外部的檔案修改。只要判定修改的檔案與綁定的 `$currentFileStore` 相同，就會觸發 `loadTasks()` 重新解析檔案，並將結果推入 `$tasksStore`，進而觸發 Svelte 的重新渲染。

### 3. Svelte 樣式隔離 (CSS Scoping)

本專案沒有依賴龐大的全域 `styles.css`，而是充分運用 Svelte 內建的 CSS 作用域 (Scoped CSS)。
這避免了我們自訂的 class（如 `.day-cell`）與 Obsidian 原生主題或他方插件的 CSS 發生衝突。同時，所有顏色皆嚴格使用 Obsidian 原生的 CSS Variables（如 `var(--interactive-accent)`），確保在各種亮暗模式或第三方佈景主題下都能完美融合。

---

## ⌨️ 本地開發與部署

如果你想要參與開發或在本地端運行此插件：

1. 將此儲存庫 Clone 到你的本地電腦：
   ```bash
   git clone https://github.com/your-username/obsidian-todo-calendar.git
   cd obsidian-todo-calendar
   ```
2. 安裝依賴套件：
   ```bash
   npm install
   ```
3. 啟動開發環境（會自動編譯 Svelte 組件並持續監聽檔案變化）：
   ```bash
   npm run dev
   ```
   *註：因為本專案的設計，編譯出來的成品 (`main.js`, `manifest.json`) 會統一輸出到專案內的 `todo-calendar/` 目錄中。*
4. 將編譯出的 `todo-calendar/` 資料夾透過**軟體連結 (Symlink)** 或直接複製，放進你 Obsidian 測試庫的 `.obsidian/plugins/` 目錄中：
   ```bash
   # macOS / Linux
   ln -s /path/to/cloned/obsidian-todo-calendar/todo-calendar /path/to/your/vault/.obsidian/plugins/todo-calendar

   # Windows (請以系統管理員身分執行命令提示字元)
   mklink /D "C:\path\to\your\vault\.obsidian\plugins\todo-calendar" "C:\path\to\cloned\obsidian-todo-calendar\todo-calendar"
   ```
5. 回到 Obsidian 中重新整理外掛清單，然後啟用「Todo Calendar」。

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
