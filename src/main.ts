import { Plugin, WorkspaceLeaf, PluginSettingTab, App, Setting } from "obsidian";
import { TodoView, VIEW_TYPE_TODO } from "./todo-view";
import { currentLanguage, t, type Language } from "./i18n";
import { get } from "svelte/store";
import { currentFileStore, showCompletedStore } from "./store";
import { FileSuggestModal } from "./FileSuggestModal";
import { TaskIndex, parseFolderList } from "./task-index";

interface TodoCalendarSettings {
  language: Language;
  targetFile: string;
  openInRightSidebar: boolean;
  includeFolders: string;
  excludeFolders: string;
  showCompleted: boolean;
}

const DEFAULT_SETTINGS: TodoCalendarSettings = {
  language: "en",
  targetFile: "todo-calendar.md",
  openInRightSidebar: false,
  includeFolders: "",
  excludeFolders: "",
  showCompleted: false,
};

export default class TodoCalendarPlugin extends Plugin {
  declare settings: TodoCalendarSettings;
  taskIndex!: TaskIndex;

  async onload() {
    await this.loadSettings();
    currentLanguage.set(this.settings.language);
    currentFileStore.set(this.settings.targetFile);
    showCompletedStore.set(this.settings.showCompleted);

    this.taskIndex = new TaskIndex(this.app, () => ({
      includeFolders: parseFolderList(this.settings.includeFolders),
      excludeFolders: parseFolderList(this.settings.excludeFolders),
    }));
    this.app.workspace.onLayoutReady(() => {
      this.taskIndex.start((ref) => this.registerEvent(ref));
    });

    this.register(
      showCompletedStore.subscribe((value) => {
        if (this.settings.showCompleted !== value) {
          this.settings.showCompleted = value;
          void this.saveSettings();
        }
      }),
    );

    this.registerView(
      VIEW_TYPE_TODO,
      (leaf: WorkspaceLeaf) => new TodoView(leaf, this)
    );

    this.addRibbonIcon("calendar-with-checkmark", "Open Todo Calendar", () => {
      void this.activateView();
    });

    this.addCommand({
      id: "open-view",
      name: "Open View",
      callback: () => {
        void this.activateView();
      },
    });

    this.addSettingTab(new TodoCalendarSettingTab(this.app, this));
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) as Partial<TodoCalendarSettings>);
  }

  async saveSettings() {
    await this.saveData(this.settings);
    currentLanguage.set(this.settings.language);
  }

  async activateView() {
    const { workspace } = this.app;

    // 如果已經有開啟的視圖，直接顯示它
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_TODO)[0];

    if (!leaf) {
      if (this.settings.openInRightSidebar) {
        leaf = workspace.getRightLeaf(false) || workspace.getLeaf(false);
      } else {
        leaf = workspace.getLeaf(false);
      }
      await leaf.setViewState({ type: VIEW_TYPE_TODO, active: true });
    }

    void workspace.revealLeaf(leaf);
  }

  onunload() {}
}

class TodoCalendarSettingTab extends PluginSettingTab {
  plugin: TodoCalendarPlugin;

  constructor(app: App, plugin: TodoCalendarPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  // @ts-ignore
  getSettingDefinitions() {
    return [];
  }

  display(): void {
    const { containerEl } = this;
    const $t = get(t);
    containerEl.empty();

    new Setting(containerEl)
      .setName($t.settings_language_name)
      .setDesc($t.settings_language_desc)
      .addDropdown((dropdown) => {
        dropdown
          .addOption("en", "English")
          .addOption("zh-TW", "繁體中文")
          .setValue(this.plugin.settings.language)
          .onChange(async (value) => {
            this.plugin.settings.language = value as Language;
            await this.plugin.saveSettings();
            // @ts-ignore
            this.display();
          });
      });

    new Setting(containerEl)
      .setName($t.settings_target_name)
      .setDesc($t.settings_target_desc)
      .addText((text) => {
        text.setValue(this.plugin.settings.targetFile).setDisabled(true);
      })
      .addButton((button) => {
        button.setButtonText($t.settings_change_btn).onClick(() => {
          new FileSuggestModal(this.plugin.app, (file) => {
            this.plugin.settings.targetFile = file.path;
            void this.plugin.saveSettings().then(() => {
              currentFileStore.set(file.path);
              // @ts-ignore
              this.display();
            });
          }).open();
        });
      });

    new Setting(containerEl)
      .setName($t.settings_include_folders_name)
      .setDesc($t.settings_include_folders_desc)
      .addTextArea((text) => {
        text
          .setPlaceholder("Projects\nBoards")
          .setValue(this.plugin.settings.includeFolders)
          .onChange(async (value) => {
            this.plugin.settings.includeFolders = value;
            await this.plugin.saveSettings();
          });
        text.inputEl.addEventListener("blur", () => void this.plugin.taskIndex.rebuild());
      });

    new Setting(containerEl)
      .setName($t.settings_exclude_folders_name)
      .setDesc($t.settings_exclude_folders_desc)
      .addTextArea((text) => {
        text
          .setPlaceholder("Templates\nArchive")
          .setValue(this.plugin.settings.excludeFolders)
          .onChange(async (value) => {
            this.plugin.settings.excludeFolders = value;
            await this.plugin.saveSettings();
          });
        text.inputEl.addEventListener("blur", () => void this.plugin.taskIndex.rebuild());
      });

    new Setting(containerEl)
      .setName($t.settings_open_sidebar_name)
      .setDesc($t.settings_open_sidebar_desc)
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.openInRightSidebar)
          .onChange(async (value) => {
            this.plugin.settings.openInRightSidebar = value;
            await this.plugin.saveSettings();
          });
      });
  }
}
