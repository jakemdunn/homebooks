import browser from "webextension-polyfill";
import { BOOKMARK_MENU_ACTIONS } from "./util/menu.bookmark";
import { FOLDER_MENU_ACTIONS } from "./util/menu.folder";
import { ExtensionStorageData } from "./util/storage.types";

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
