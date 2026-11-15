import type { Bookmarks } from "webextension-polyfill";

/**
 * Chromium's BookmarkTreeNode has no `type`; Firefox's does. Fills `type`
 * from `url` when it's missing so the app can branch on it everywhere.
 */
export const withBookmarkNodeType = <T extends Bookmarks.BookmarkTreeNode>(
  node: T,
): T => ({
  ...node,
  type: node.type ?? (node.url ? "bookmark" : "folder"),
  ...(node.children && {
    children: node.children.map((child) => withBookmarkNodeType(child)),
  }),
});
