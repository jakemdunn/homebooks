import { IconType } from "react-icons";
import browser from "webextension-polyfill";

type MenuIds = Record<string, string>;

export type MenuActionInfo = {
  bookmarkId?: string;
  setCurrentEdit?: (node?: browser.Bookmarks.BookmarkTreeNode) => void;
};

export interface NormalMenuItem<T extends MenuIds = MenuIds> {
  type: "normal";
  title: string;
  id: T[keyof T];
  action: (info: MenuActionInfo, tab?: browser.Tabs.Tab) => void;
  icon?: IconType;
}

export interface SeparatorMenuItem {
  type: "separator";
  id: string;
}

export type MenuItem<T extends MenuIds = MenuIds> =
  | NormalMenuItem<T>
  | SeparatorMenuItem;
export type MenuItems<T extends MenuIds = MenuIds> = MenuItem<T>[];
