import browser from "webextension-polyfill";
import { BOOKMARK_MENU_ACTIONS } from "./util/menu.bookmark";
import { FOLDER_MENU_ACTIONS } from "./util/menu.folder";
import { ExtensionStorageData } from "./util/storage.types";
import { installChromiumBookmarksShim } from "./util/chromiumBookmarksShim";
import { createSiteIconRecorder } from "./util/siteIconRecorder";
import { isSiteIconMessage } from "./util/siteIconMessages";

installChromiumBookmarksShim();

const siteIconRecorder = createSiteIconRecorder(browser);
const logSiteIconError = (error: unknown) =>
  console.error("Couldn't update the Site Icon cache.", error);

browser.tabs.onUpdated.addListener((_tabId, change, tab) => {
  if (change.favIconUrl)
    siteIconRecorder.tabUpdated(tab).catch(logSiteIconError);
});
browser.bookmarks.onCreated.addListener((_id, bookmark) => {
  siteIconRecorder.bookmarkCreated(bookmark).catch(logSiteIconError);
});
browser.bookmarks.onRemoved.addListener(() => {
  siteIconRecorder.bookmarkRemoved().catch(logSiteIconError);
});
browser.bookmarks.onChanged.addListener((_id, change) => {
  siteIconRecorder.bookmarkChanged(change).catch(logSiteIconError);
});
browser.runtime.onMessage.addListener((message: unknown) => {
  if (!isSiteIconMessage(message)) return undefined;
  const record =
    message.type === "siteIcons.lookedUp"
      ? siteIconRecorder.lookedUp(message.found)
      : siteIconRecorder.tabsBookmarked(message.found);
  // Answering once recorded lets the sender wait for it.
  return record.catch(logSiteIconError);
});

const handlePermissionsUpdate = async () => {
  const visible = await browser.extension.isAllowedIncognitoAccess();
  await browser.storage.local.set({
    menuVisibility: {
      [BOOKMARK_MENU_ACTIONS.openInPrivateWindow]: visible,
      [FOLDER_MENU_ACTIONS.openInPrivateWindow]: visible,
    },
  } as ExtensionStorageData);
};

browser.permissions.onAdded.addListener(handlePermissionsUpdate);
browser.permissions.onRemoved.addListener(handlePermissionsUpdate);

browser.runtime.onInstalled.addListener(async (details) => {
  console.log("extension installed", details);
  await handlePermissionsUpdate();
});

browser.runtime.onStartup.addListener(() => {
  handlePermissionsUpdate();
});
