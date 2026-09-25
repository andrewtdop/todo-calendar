import { ItemView, WorkspaceLeaf } from "obsidian";
import App from "./components/App.svelte";
import type TodoCalendarPlugin from "./main";

export const VIEW_TYPE_TODO = "todo-calendar-view";

export class TodoView extends ItemView {
  component!: App;
  plugin: TodoCalendarPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: TodoCalendarPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType() {
    return VIEW_TYPE_TODO;
  }

  getDisplayText() {
    return "Todo Calendar";
  }

  getIcon(): string {
    return "calendar-with-checkmark";
  }

  async onOpen() {
    this.contentEl.empty();
    this.component = new App({
      target: this.contentEl,
      props: {
        app: this.app,
      }
    });
  }

  async onClose() {
    this.component.$destroy();
  }
}
