import * as yup from "yup";
import { useStorage } from "./useStorage";
import * as i18nMessages from "../../public/_locales/en/messages.json";

export const useExtensionStorage = () =>
  useStorage<Record<string, boolean>>("menuVisibility", {}, "local");

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
    .default("contextMenuOptionRightClick"),
});

export type SettingsData = yup.InferType<typeof settingsSchema>;

export function normalizeSettings(data: object): SettingsData {
  return settingsSchema.cast(data, { stripUnknown: true }) as SettingsData;
}

const DEFAULT_SETTINGS = normalizeSettings({});
export const useSettingsStorage = () =>
  useStorage("settings", DEFAULT_SETTINGS, "sync");
