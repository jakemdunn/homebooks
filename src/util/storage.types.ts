import { useStorage } from "./useStorage";
import * as i18nMessages from "../../public/_locales/en/messages.json";

export interface ExtensionStorageData {
  menuVisibility?: Record<string, boolean>;
}
export const useExtensionStorage = () =>
  useStorage<ExtensionStorageData>("menuVisibility", "local");

export type ContextMenuOption = Extract<
  keyof typeof i18nMessages,
  | "contextMenuOptionBoth"
  | "contextMenuOptionDisplayed"
  | "contextMenuOptionRightClick"
>;
export interface SettingsData {
  rootFolder: string;
  contextMenus: ContextMenuOption;
}
const DEFAULT_SETTINGS: SettingsData = {
  rootFolder: "menu________",
  contextMenus: "contextMenuOptionBoth",
};

export const useSettingsStorage = () => useStorage(DEFAULT_SETTINGS, "sync");
