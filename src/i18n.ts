import { writable, derived } from 'svelte/store';

export type Language = 'en' | 'zh-TW';

export const currentLanguage = writable<Language>('en');

const translations = {
  en: {
    // App / ControlPanel
    no_tasks_for_day: "No tasks for this day.",
    add_new_task: "Add a new task...",
    delete_confirm: "Are you sure you want to delete this task?",
    delete_prompt: "Delete?",
    yes: "Yes",
    no: "No",
    tasks_for: "Tasks for",
    select_date: "Select a date on the calendar to view and manage tasks.",

    // FilterPanel
    filtered_tasks: "Filtered Tasks",
    filter_overdue: "Overdue",
    filter_upcoming_3: "Next 3 Days",
    filter_upcoming_7: "Next 7 Days",
    filter_upcoming_14: "Next 14 Days",
    filter_uncompleted: "Uncompleted",
    filter_completed: "Completed",
    filter_all: "All",
    no_tasks_match: "No tasks match your filters.",

    // NoDeadlinePanel
    no_deadline_tasks: "No Deadline Tasks",
    no_undated_tasks: "No undated tasks.",
    add_no_deadline_task: "Add a no-deadline task...",
    add_no_deadline_btn: "Add a task without specific deadline",
    add: "Add",

    // Calendar
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    show_completed: "Show completed",

    // TaskItem
    open_in_note: "Open in note",

    // Settings
    settings_language_name: "Language",
    settings_language_desc: "Choose the display language for the Todo Calendar view.",
    settings_target_name: "Inbox file",
    settings_target_desc: "Tasks are read from your whole vault. New tasks added from the calendar are saved to this file, and its undated tasks appear under \"No Deadline Tasks\".",
    settings_include_folders_name: "Include folders",
    settings_include_folders_desc: "Only scan these folders for tasks (one per line). Leave empty to scan the whole vault.",
    settings_exclude_folders_name: "Exclude folders",
    settings_exclude_folders_desc: "Never scan these folders for tasks (one per line), e.g. your templates folder.",
    settings_change_btn: "Change",
    settings_open_sidebar_name: "Open in Right Sidebar",
    settings_open_sidebar_desc: "When enabled, opening the calendar will place it in the right sidebar instead of the main workspace. Requires restarting the plugin to take effect.",
  },
  'zh-TW': {
    // App / ControlPanel
    no_tasks_for_day: "這天沒有待辦事項。",
    add_new_task: "輸入待辦事項...",
    delete_confirm: "確定要刪除這筆事項嗎？",
    delete_prompt: "刪除？",
    yes: "是",
    no: "否",
    tasks_for: "待辦事項：",
    select_date: "在月曆上點選一個日期來檢視和管理待辦事項。",

    // FilterPanel
    filtered_tasks: "篩選事項",
    filter_overdue: "已過期",
    filter_upcoming_3: "未來 3 天",
    filter_upcoming_7: "未來 7 天",
    filter_upcoming_14: "未來 14 天",
    filter_uncompleted: "未完成",
    filter_completed: "已完成",
    filter_all: "全部",
    no_tasks_match: "沒有符合篩選條件的事項。",

    // NoDeadlinePanel
    no_deadline_tasks: "無期限事項",
    no_undated_tasks: "目前沒有無期限事項。",
    add_no_deadline_task: "輸入無期限事項...",
    add_no_deadline_btn: "新增沒有特定日期的事項",
    add: "新增",

    // Calendar
    months: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
    weekdays: ["日", "一", "二", "三", "四", "五", "六"],
    show_completed: "顯示已完成",

    // TaskItem
    open_in_note: "在筆記中開啟",

    // Settings
    settings_language_name: "語言",
    settings_language_desc: "選擇 Todo Calendar 面板的顯示語言。",
    settings_target_name: "收件匣檔案",
    settings_target_desc: "待辦事項會從整個筆記庫讀取。從月曆新增的事項會儲存到此檔案，其中無期限的事項會顯示在「無期限事項」。",
    settings_include_folders_name: "包含的資料夾",
    settings_include_folders_desc: "只掃描這些資料夾中的待辦事項（每行一個）。留空則掃描整個筆記庫。",
    settings_exclude_folders_name: "排除的資料夾",
    settings_exclude_folders_desc: "不掃描這些資料夾中的待辦事項（每行一個），例如範本資料夾。",
    settings_change_btn: "變更",
    settings_open_sidebar_name: "在右側邊欄開啟",
    settings_open_sidebar_desc: "啟用後，開啟插件會將面板開啟於右側邊欄而非主畫面。變更此選項須重啟插件。",
  }
};

export const t = derived(currentLanguage, ($lang) => translations[$lang]);
