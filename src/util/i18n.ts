import * as i18nMessages from "../../public/_locales/en/messages.json";

export const i18n = (key: keyof typeof i18nMessages) =>
  browser.i18n.getMessage(key);
