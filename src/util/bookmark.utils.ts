import browser from "webextension-polyfill";
import { MenuItems, NormalMenuItem } from "./menu.constants";
import { i18n } from "./i18n";

export const BOOKMARK_MENU_ACTIONS = {
  openInTab: "CONTEXT_MENU_BOOKMARK_OPENINTAB",
  openInNewWindow: "CONTEXT_MENU_BOOKMARK_OPENINNEWWINDOW",
  openInPrivateWindow: "CONTEXT_MENU_BOOKMARK_OPENINPRIVATEWINDOW",
  edit: "CONTEXT_MENU_BOOKMARK_EDIT",
  delete: "CONTEXT_MENU_BOOKMARK_DELETE",
  cut: "CONTEXT_MENU_BOOKMARK_CUT",
  copy: "CONTEXT_MENU_BOOKMARK_COPY",
  paste: "CONTEXT_MENU_BOOKMARK_PASTE",
} as const;

const bookmarkAction =
  (withBookmark: (bookmark: browser.Bookmarks.BookmarkTreeNode) => void) =>
  async (data: Parameters<NormalMenuItem["action"]>[0]) => {
    if (!data.bookmarkId) return;

    const bookmark = (await browser.bookmarks.get(data.bookmarkId))[0];
    if (!bookmark) throw new Error(`Invalid bookmark ID ${data.bookmarkId}`);
    if (!bookmark.url) return;
    await withBookmark(bookmark);
  };

export const writeBookmarkToClipboard = async (
  bookmark: browser.Bookmarks.BookmarkTreeNode,
) => {
  const anchorHtml = `<A HREF="${bookmark.url}">${bookmark.title}</A>`;
  const clipboardItem = new ClipboardItem({
    "text/plain": new Blob([bookmark.url!], {
      type: "text/plain",
    }),
    "text/html": new Blob([anchorHtml], {
      type: "text/html",
    }),
  });
  await navigator.clipboard.write([clipboardItem]);
};

export const getBookMarkFromClipboard = async (): Promise<
  browser.Bookmarks.CreateDetails | undefined
> => {
  try {
    const contents = await navigator.clipboard.read({
      unsanitized: ["text/html"],
    });

    const item = contents.at(0);
    if (item?.types.includes("text/html")) {
      const html = await (await item.getType("text/html")).text();
      const url = html.match(/<a.*?href="(.*?)"/i)?.[1];
      const title = html.match(/<a.*?>(.*?)<\//i)?.[1];
      if (url && title) {
        return {
          url,
          title,
        };
      }
    }
  } catch (error) {
    console.error(error);
  }

  try {
    // const text = await navigator.clipboard.readText();
    // TODO: Launch create dialog
    //   const url = new URL(text);
    //   await browser.permissions.request({
    //     origins: [`*//${url.host}/*`],
    //   });
    //   const content = await fetch(url);
    //   console.log(content);
  } catch (error) {
    console.error(error);
  }
};

export const BookmarkMenu: MenuItems<typeof BOOKMARK_MENU_ACTIONS> = [
  {
    id: BOOKMARK_MENU_ACTIONS.openInTab,
    title: i18n("openInTab"),
    type: "normal",
    action: bookmarkAction((bookmark) => {
      browser.tabs.create({ url: bookmark.url, active: true });
    }),
  },

  {
    id: BOOKMARK_MENU_ACTIONS.openInNewWindow,
    title: i18n("openInWindow"),
    type: "normal",
    action: bookmarkAction(async (bookmark) => {
      browser.windows.create({ url: bookmark.url });
    }),
  },
  {
    id: BOOKMARK_MENU_ACTIONS.openInPrivateWindow,
    title: i18n("openInPrivateWindow"),
    type: "normal",
    action: bookmarkAction(async (bookmark) => {
      browser.windows.create({ url: bookmark.url, incognito: true });
    }),
  },
  { type: "separator" },
  {
    id: BOOKMARK_MENU_ACTIONS.edit,
    title: i18n("editBookmark"),
    type: "normal",
    action: bookmarkAction(async (bookmark) => {
      //TODO: Launch edit dialog
      console.log(bookmark);
      throw new Error("Not yet implemented");
    }),
  },
  {
    id: BOOKMARK_MENU_ACTIONS.delete,
    title: i18n("deleteBookmark"),
    type: "normal",
    action: bookmarkAction(async (bookmark) => {
      browser.bookmarks.remove(bookmark.id);
    }),
  },
  { type: "separator" },
  {
    id: BOOKMARK_MENU_ACTIONS.cut,
    title: i18n("cutBookmark"),
    type: "normal",
    action: bookmarkAction(async (bookmark) => {
      await writeBookmarkToClipboard(bookmark);
      browser.bookmarks.remove(bookmark.id);
    }),
  },
  {
    id: BOOKMARK_MENU_ACTIONS.copy,
    title: i18n("copyBookmark"),
    type: "normal",
    action: bookmarkAction(async (bookmark) => {
      await writeBookmarkToClipboard(bookmark);
    }),
  },
  {
    id: BOOKMARK_MENU_ACTIONS.paste,
    title: i18n("pasteBookmark"),
    type: "normal",
    action: bookmarkAction(async (bookmark) => {
      const newBookmark = await getBookMarkFromClipboard();
      if (newBookmark) {
        browser.bookmarks.create({
          ...newBookmark,
          parentId: bookmark.parentId,
          index: (bookmark.index ?? -1) + 1,
        });
      }
    }),
  },
];
