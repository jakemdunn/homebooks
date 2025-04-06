import browser from "webextension-polyfill";
import { MenuItems, NormalMenuItem } from "./menu.constants";
import { i18n } from "./i18n";
import {
  FaLock,
  FaPlusCircle,
  FaPlusSquare,
  FaEdit,
  FaTrash,
  FaCut,
  FaCopy,
  FaPaste,
} from "react-icons/fa";
import {
  insertBookMarksFromClipboard,
  getAllBookmarksInNodes,
  writeBookmarksToClipboard,
} from "./bookmark.utils";

export const FOLDER_MENU_ACTIONS = {
  openInCurrentWindow: "CONTEXT_MENU_FOLDER_OPENINCURRENTWINDOW",
  openInNewWindow: "CONTEXT_MENU_FOLDER_OPENINNEWWINDOW",
  openInPrivateWindow: "CONTEXT_MENU_FOLDER_OPENINPRIVATEWINDOW",
  edit: "CONTEXT_MENU_FOLDER_EDIT",
  delete: "CONTEXT_MENU_FOLDER_DELETE",
  cut: "CONTEXT_MENU_FOLDER_CUT",
  copy: "CONTEXT_MENU_FOLDER_COPY",
  paste: "CONTEXT_MENU_FOLDER_PASTE",
} as const;

const nodesAction =
  (withNodes: (nodes: browser.Bookmarks.BookmarkTreeNode[]) => void) =>
  async (data: Parameters<NormalMenuItem["action"]>[0]) => {
    if (!data.bookmarkId) return;

    const nodes = await browser.bookmarks.getSubTree(data.bookmarkId);
    if (!nodes) throw new Error(`Invalid node ID ${data.bookmarkId}`);
    await withNodes(nodes);
  };

export const FolderMenu: MenuItems<typeof FOLDER_MENU_ACTIONS> = [
  {
    id: FOLDER_MENU_ACTIONS.openInCurrentWindow,
    title: i18n("openFolderInCurrentWindow"),
    type: "normal",
    icon: FaPlusCircle,
    action: nodesAction((nodes) => {
      getAllBookmarksInNodes(nodes).forEach((node) => {
        browser.tabs.create({ url: node.url, active: true });
      });
    }),
  },

  {
    id: FOLDER_MENU_ACTIONS.openInNewWindow,
    title: i18n("openFolderInNewWindow"),
    type: "normal",
    icon: FaPlusSquare,
    action: nodesAction(async (nodes) => {
      let window: browser.Windows.Window | undefined = undefined;
      for (const node of getAllBookmarksInNodes(nodes)) {
        if (!window) {
          window = await browser.windows.create({ url: node.url });
        } else {
          await browser.tabs.create({ url: node.url, windowId: window.id });
        }
      }
    }),
  },
  {
    id: FOLDER_MENU_ACTIONS.openInPrivateWindow,
    title: i18n("openFolderInPrivateWindow"),
    type: "normal",
    icon: FaLock,
    action: nodesAction(async (nodes) => {
      let window: browser.Windows.Window | undefined = undefined;
      for (const node of getAllBookmarksInNodes(nodes)) {
        if (!window) {
          window = await browser.windows.create({
            url: node.url,
            incognito: true,
          });
        } else {
          await browser.tabs.create({ url: node.url, windowId: window.id });
        }
      }
    }),
  },
  { type: "separator", id: "FOLDER-SEPARATOR-0" },
  {
    id: FOLDER_MENU_ACTIONS.edit,
    title: i18n("editFolder"),
    type: "normal",
    icon: FaEdit,
    action: nodesAction(async (node) => {
      //TODO: Launch edit dialog
      console.log(node);
      throw new Error("Not yet implemented");
    }),
  },
  {
    id: FOLDER_MENU_ACTIONS.delete,
    title: i18n("deleteFolder"),
    type: "normal",
    icon: FaTrash,
    action: nodesAction(async (nodes) => {
      for (const node of nodes) {
        browser.bookmarks.removeTree(node.id);
      }
    }),
  },
  { type: "separator", id: "FOLDER-SEPARATOR-1" },
  {
    id: FOLDER_MENU_ACTIONS.cut,
    title: i18n("cutFolder"),
    type: "normal",
    icon: FaCut,
    action: nodesAction(async (nodes) => {
      await writeBookmarksToClipboard(nodes);
      for (const node of nodes) {
        browser.bookmarks.removeTree(node.id);
      }
    }),
  },
  {
    id: FOLDER_MENU_ACTIONS.copy,
    title: i18n("copyFolder"),
    type: "normal",
    icon: FaCopy,
    action: nodesAction(async (nodes) => {
      await writeBookmarksToClipboard(nodes);
    }),
  },
  {
    id: FOLDER_MENU_ACTIONS.paste,
    title: i18n("pasteFolder"),
    type: "normal",
    icon: FaPaste,
    action: nodesAction(async (nodes) => {
      await insertBookMarksFromClipboard(nodes[0]);
    }),
  },
];
