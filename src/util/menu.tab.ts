import browser from "webextension-polyfill";
import { MenuItems } from "./menu.constants";
import { i18n } from "./i18n";
import { FaBookmark } from "react-icons/fa";

export const TAB_MENU_ACTIONS = {
  createBookmark: "CONTEXT_MENU_TAB_CREATE_BOOKMARK",
} as const;

export const TabMenu: MenuItems<typeof TAB_MENU_ACTIONS> = [
  {
    id: TAB_MENU_ACTIONS.createBookmark,
    title: i18n("createBookmark"),
    type: "normal",
    icon: FaBookmark,
    action: async (_, tab) => {
      if (!tab) return;
      const activeTab = (
        await browser.tabs.query({ active: true, lastFocusedWindow: true })
      )[0];
      if (activeTab.id) {
        browser.tabs.sendMessage(activeTab.id, {
          action: "createBookmarkFromTab",
          data: {
            tabId: tab.id,
          },
        });
      }
    },
  },
];
