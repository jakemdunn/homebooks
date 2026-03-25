import * as yup from "yup";
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

export const CONTEXT_MENU_OPTIONS: ContextMenuOption[] = [
  "contextMenuOptionBoth",
  "contextMenuOptionDisplayed",
  "contextMenuOptionRightClick",
];

export const settingsSchema = yup.object({
  rootFolder: yup.string().default("unfiled_____"),
  contextMenus: yup
    .mixed<ContextMenuOption>()
    .oneOf(CONTEXT_MENU_OPTIONS)
    .default("contextMenuOptionBoth"),
});

export type SettingsData = yup.InferType<typeof settingsSchema>;

export function normalizeSettings(data: object): SettingsData {
  return settingsSchema.cast(data, { stripUnknown: true }) as SettingsData;
}

export function areSettingsEqual(a: object, b: object): boolean {
  const na = normalizeSettings(a);
  const nb = normalizeSettings(b);
  return (
    na.rootFolder === nb.rootFolder && na.contextMenus === nb.contextMenus
  );
}

const DEFAULT_SETTINGS = normalizeSettings({});
export const useSettingsStorage = () => useStorage(DEFAULT_SETTINGS, "sync");
