import { useCallback } from "react";
import * as i18nMessages from "../../public/_locales/en/messages.json";

type I18nKeys = keyof typeof i18nMessages;
export const i18n = (key: I18nKeys) => browser.i18n.getMessage(key);
export const useI18n = () => useCallback((key: I18nKeys) => i18n(key), []);
