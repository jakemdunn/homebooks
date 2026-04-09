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
    action: async (info, tab) => {
      if (!tab) return;
      info.openNewBookmarkModal?.({
        title: tab.title ?? "",
        url: tab.url ?? "",
      });
    },
  },
];
