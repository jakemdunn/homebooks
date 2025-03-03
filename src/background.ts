import browser from "webextension-polyfill";
import { BOOKMARK_MENU_ACTIONS, BookmarkMenu } from "./util/bookmark.utils";
import { MenuItems, NormalMenuItem } from "./util/menu.constants";

browser.runtime.onInstalled.addListener((details) => {
  console.log("Extension installed:", details);
});

const createMenuItem = async (
  props: Partial<browser.Menus.CreateCreatePropertiesType>,
) => {
  return new Promise<void>((resolve, reject) => {
    browser.menus.create(
      {
        type: "normal",
        contexts: ["bookmark"],
        documentUrlPatterns: [`moz-extension://${location.host}/*`],
        viewTypes: ["tab"],
        ...props,
      },
      () => {
        if (browser.runtime.lastError) {
          console.log(browser.runtime.lastError);
          reject(browser.runtime.lastError);
        } else {
          resolve();
        }
      },
    );
  });
};
const createSeparator = async () =>
  createMenuItem({
    type: "separator",
  });

const createMenu = async (items: MenuItems) => {
  for (const item of items) {
    switch (item.type) {
      case "normal":
        await createMenuItem({
          type: item.type,
          id: item.id,
          title: item.title,
        });
        break;
      case "separator":
        await createSeparator();
        break;
    }
  }
};

createMenu(BookmarkMenu);
// TODO: Handle menu items for folders
// TODO: Handle menu items for windows
// TODO: Handle menu items for tabs

const handlePermissionsUpdate = async () => {
  const visible = await browser.extension.isAllowedIncognitoAccess();
  browser.menus.update(BOOKMARK_MENU_ACTIONS.openInPrivateWindow, {
    visible,
  });
};
handlePermissionsUpdate();

browser.permissions.onAdded.addListener(handlePermissionsUpdate);
browser.permissions.onRemoved.addListener(handlePermissionsUpdate);

const handleMenu = async (info: browser.Menus.OnClickData) => {
  const matched = BookmarkMenu.find(
    (item) => item.type === "normal" && item.id === info.menuItemId,
  ) as NormalMenuItem | undefined;
  await matched?.action(info);
};

browser.menus.onClicked.addListener(handleMenu);
