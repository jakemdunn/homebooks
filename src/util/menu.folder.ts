// import browser from "webextension-polyfill";
// import { MenuItems, NormalMenuItem } from "./menu.constants";
// import { i18n } from "./i18n";
// import {
//   FaLock,
//   FaPlusCircle,
//   FaPlusSquare,
//   FaEdit,
//   FaTrash,
//   FaCut,
//   FaCopy,
//   FaPaste,
// } from "react-icons/fa";

// export const FOLDER_MENU_ACTIONS = {
//   openInTab: "CONTEXT_MENU_FOLDER_OPENINTAB",
//   openInNewWindow: "CONTEXT_MENU_FOLDER_OPENINNEWWINDOW",
//   openInPrivateWindow: "CONTEXT_MENU_FOLDER_OPENINPRIVATEWINDOW",
//   edit: "CONTEXT_MENU_FOLDER_EDIT",
//   delete: "CONTEXT_MENU_FOLDER_DELETE",
//   cut: "CONTEXT_MENU_FOLDER_CUT",
//   copy: "CONTEXT_MENU_FOLDER_COPY",
//   paste: "CONTEXT_MENU_FOLDER_PASTE",
// } as const;

// const nodesAction =
//   (withNodes: (nodes: browser.Bookmarks.BookmarkTreeNode[]) => void) =>
//   async (data: Parameters<NormalMenuItem["action"]>[0]) => {
//     if (!data.bookmarkId) return;

//     const nodes = (await browser.bookmarks.get(data.bookmarkId));
//     if (!nodes) throw new Error(`Invalid node ID ${data.bookmarkId}`);
//     await withNodes(nodes);
//   };

// export const getAllBookmarksInNodes = (
//   nodes: browser.Bookmarks.BookmarkTreeNode[]
// ): browser.Bookmarks.BookmarkTreeNode[] =>
//     nodes.reduce<browser.Bookmarks.BookmarkTreeNode[]>(
//         (allBookmarks, bookmark) => [
//           ...allBookmarks,
//           ...(bookmark.children ? getAllBookmarksInNodes(bookmark.children) : [bookmark]),
//         ],
//         []
//       ) ?? [];

// export const writeNodesToClipboard = async (
//   nodes: browser.Bookmarks.BookmarkTreeNode[]
// ) => {
//   const allBookmarks = getAllBookmarksInNodes(nodes);
//   const clipboardItem = new ClipboardItem({
//     "text/plain": new Blob(
//       [allBookmarks.map((bookmark) => bookmark.url).join(", ")],
//       {
//         type: "text/plain",
//       }
//     ),
//     "text/html": new Blob(
//       [
//         allBookmarks
//           .map((bookmark) => `<A HREF="${bookmark.url}">${bookmark.title}</A>`)
//           .join(""),
//       ],
//       {
//         type: "text/html",
//       }
//     ),
//   });
//   await navigator.clipboard.write([clipboardItem]);
// };

// export const getBookMarksFromClipboard = async (): Promise<
//   browser.Bookmarks.CreateDetails[] | undefined
// > => {
//   try {
//     const contents = await navigator.clipboard.read({
//       unsanitized: ["text/html"],
//     });

//     const item = contents.at(0);
//     if (item?.types.includes("text/html")) {
//       const html = await (await item.getType("text/html")).text();
//       const url = html.match(/<a.*?href="(.*?)"/i)?.[1];
//       const title = html.match(/<a.*?>(.*?)<\//i)?.[1];
//       if (url && title) {
//         return {
//           url,
//           title,
//         };
//       }
//     }
//   } catch (error) {
//     console.error(error);
//   }

//   try {
//     // const text = await navigator.clipboard.readText();
//     // TODO: Launch create dialog
//     //   const url = new URL(text);
//     //   await browser.permissions.request({
//     //     origins: [`*//${url.host}/*`],
//     //   });
//     //   const content = await fetch(url);
//     //   console.log(content);
//   } catch (error) {
//     console.error(error);
//   }
// };

// export const FolderMenu: MenuItems<typeof FOLDER_MENU_ACTIONS> = [
//   {
//     id: FOLDER_MENU_ACTIONS.openInTab,
//     title: i18n("openInTab"),
//     type: "normal",
//     icon: FaPlusCircle,
//     action: nodesAction((node) => {
//       browser.tabs.create({ url: node.url, active: true });
//     }),
//   },

//   {
//     id: FOLDER_MENU_ACTIONS.openInNewWindow,
//     title: i18n("openInWindow"),
//     type: "normal",
//     icon: FaPlusSquare,
//     action: nodesAction(async (node) => {
//       browser.windows.create({ url: node.url });
//     }),
//   },
//   {
//     id: FOLDER_MENU_ACTIONS.openInPrivateWindow,
//     title: i18n("openInPrivateWindow"),
//     type: "normal",
//     icon: FaLock,
//     action: nodesAction(async (node) => {
//       browser.windows.create({ url: node.url, incognito: true });
//     }),
//   },
//   { type: "separator", id: "FOLDER-SEPARATOR-0" },
//   {
//     id: FOLDER_MENU_ACTIONS.edit,
//     title: i18n("editFolder"),
//     type: "normal",
//     icon: FaEdit,
//     action: nodesAction(async (node) => {
//       //TODO: Launch edit dialog
//       console.log(node);
//       throw new Error("Not yet implemented");
//     }),
//   },
//   {
//     id: FOLDER_MENU_ACTIONS.delete,
//     title: i18n("deleteFolder"),
//     type: "normal",
//     icon: FaTrash,
//     action: nodesAction(async (node) => {
//       browser.bookmarks.remove(node.id);
//     }),
//   },
//   { type: "separator", id: "FOLDER-SEPARATOR-1" },
//   {
//     id: FOLDER_MENU_ACTIONS.cut,
//     title: i18n("cutFolder"),
//     type: "normal",
//     icon: FaCut,
//     action: nodesAction(async (node) => {
//       await writeNodeToClipboard(node);
//       browser.bookmarks.remove(node.id);
//     }),
//   },
//   {
//     id: FOLDER_MENU_ACTIONS.copy,
//     title: i18n("copyFolder"),
//     type: "normal",
//     icon: FaCopy,
//     action: nodesAction(async (node) => {
//       await writeNodeToClipboard(node);
//     }),
//   },
//   {
//     id: FOLDER_MENU_ACTIONS.paste,
//     title: i18n("pasteFolder"),
//     type: "normal",
//     icon: FaPaste,
//     action: nodesAction(async (node) => {
//       const newFolder = await getBookMarkFromClipboard();
//       if (newFolder) {
//         browser.bookmarks.create({
//           ...newFolder,
//           parentId: node.parentId,
//           index: (node.index ?? -1) + 1,
//         });
//       }
//     }),
//   },
// ];
