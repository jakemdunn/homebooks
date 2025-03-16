import browser from "webextension-polyfill";
import { BOOKMARK_MENU_ACTIONS, BookmarkMenu } from "./util/menu.bookmark";
import { MenuItems, NormalMenuItem } from "./util/menu.constants";
import { TabMenu } from "./util/menu.tab";
import { ExtensionStorageData } from "./util/storage.types";

const createMenuItem = async (
  props: Partial<browser.Menus.CreateCreatePropertiesType>
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
      }
    );
  });
};

const createSeparator = async (
  props: Pick<browser.Menus.CreateCreatePropertiesType, "id">
) =>
  createMenuItem({
    type: "separator",
    ...props,
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
        await createSeparator({ id: item.id });
        break;
    }
  }
};

const handlePermissionsUpdate = async () => {
  const visible = await browser.extension.isAllowedIncognitoAccess();
  await browser.storage.local.set({
    menuVisibility: {
      [BOOKMARK_MENU_ACTIONS.openInPrivateWindow]: visible,
    },
  } as ExtensionStorageData);
  await browser.menus.update(BOOKMARK_MENU_ACTIONS.openInPrivateWindow, {
    visible,
  });
};

const handleMenu = async (info: browser.Menus.OnClickData) => {
  const matched = BookmarkMenu.find(
    (item) => item.type === "normal" && item.id === info.menuItemId
  ) as NormalMenuItem | undefined;
  await matched?.action(info);
};

browser.permissions.onAdded.addListener(handlePermissionsUpdate);
browser.permissions.onRemoved.addListener(handlePermissionsUpdate);
browser.menus.onClicked.addListener(handleMenu);

browser.runtime.onInstalled.addListener(async (details) => {
  console.log("extension installed", details);
  try {
    await browser.menus.removeAll();
    await createMenu(BookmarkMenu);
    await createMenu(TabMenu);
    // TODO: Handle menu items for folders
    // TODO: Handle menu items for windows
    // TODO: Handle menu items for tabs
  } catch (error) {
    console.error(error);
  }
  handlePermissionsUpdate();
});

browser.runtime.onStartup.addListener(() => {
  handlePermissionsUpdate();
});
