import browser from "webextension-polyfill";
import { SETTINGS_PANEL_VISIBLE } from "../components/settings/settings.util";

/** Matches manifest `homepage` / `newtab` document (built as `src/homepage.html`). */
export const HOMEPAGE_HTML_PATH = "src/homepage.html";

/**
 * Persists the settings-panel flag for the main HomeBooks page, focuses an
 * existing HomeBooks tab or opens one, then the caller may close the popup.
 */
export async function openHomeBooksWithSettingsPanel(): Promise<void> {
  await browser.storage.session.set({ [SETTINGS_PANEL_VISIBLE]: true });

  const homeUrl = browser.runtime.getURL(HOMEPAGE_HTML_PATH);

  const tabs = await browser.tabs.query({});
  const existing = tabs.find((t) => t.url?.startsWith(homeUrl));

  if (existing?.id != null) {
    await browser.tabs.update(existing.id, { active: true });
    if (existing.windowId != null) {
      await browser.windows.update(existing.windowId, { focused: true });
    }
    return;
  }

  await browser.tabs.create({ url: homeUrl, active: true });
}
