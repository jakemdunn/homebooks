import { IconType } from "react-icons";
import browser from "webextension-polyfill";

type MenuIds = Record<string, string>;
export interface NormalMenuItem<T extends MenuIds = MenuIds> {
  type: Extract<browser.Menus.ItemType, "normal">;
  title: string;
  id: T[keyof T];
  action: (
    info: Pick<browser.Menus.OnClickData, "bookmarkId">,
    tab?: browser.Tabs.Tab
  ) => void;
  icon?: IconType;
}

export interface SeparatorMenuItem {
  type: Extract<browser.Menus.ItemType, "separator">;
  id: string;
}

export type MenuItem<T extends MenuIds = MenuIds> =
  | NormalMenuItem<T>
  | SeparatorMenuItem;
export type MenuItems<T extends MenuIds = MenuIds> = MenuItem<T>[];
