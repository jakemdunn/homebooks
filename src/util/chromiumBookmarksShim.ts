import browser, { type Bookmarks } from "webextension-polyfill";
import { withBookmarkNodeType } from "./bookmarkNodeType";
import { clampCreateIndex, toChromiumMoveIndex } from "./bookmarkIndex";

const NODE_RETURNING_METHODS = [
  "get",
  "getChildren",
  "getRecent",
  "getSubTree",
  "getTree",
  "search",
] as const;

type Node = Bookmarks.BookmarkTreeNode;
type BookmarksApi = Bookmarks.Static;

const countChildren = async (bookmarks: BookmarksApi, parentId: string) =>
  (await bookmarks.getChildren(parentId)).length;

/** Chromium's nodes have no `type`; fill it in on every read. */
const addNodeTypes = (bookmarks: BookmarksApi) => {
  for (const method of NODE_RETURNING_METHODS) {
    const original = (
      bookmarks[method] as (...args: unknown[]) => Promise<Node | Node[]>
    ).bind(bookmarks);
    (bookmarks as unknown as Record<string, unknown>)[method] = async (
      ...args: unknown[]
    ) => {
      const result = await original(...args);
      return Array.isArray(result)
        ? result.map((node) => withBookmarkNodeType(node))
        : withBookmarkNodeType(result);
    };
  }
};

/** Chromium throws on an out-of-range create index; Firefox appends. */
const appendOutOfRangeCreates = (bookmarks: BookmarksApi) => {
  const create = bookmarks.create.bind(bookmarks);
  bookmarks.create = async (details) => {
    if (details.index === undefined || details.parentId === undefined)
      return withBookmarkNodeType(await create(details));
    const childCount = await countChildren(bookmarks, details.parentId);
    const index = clampCreateIndex(details.index, childCount);
    return withBookmarkNodeType(await create({ ...details, index }));
  };
};

/** Chromium's move index is the slot before removal; Firefox's is final. */
const adoptFinalMoveIndexes = (bookmarks: BookmarksApi) => {
  const move = bookmarks.move.bind(bookmarks);
  bookmarks.move = async (id, destination) => {
    if (destination.index === undefined)
      return withBookmarkNodeType(await move(id, destination));
    const [node] = await bookmarks.get(id);
    const parentId = destination.parentId ?? node.parentId!;
    const index = toChromiumMoveIndex({
      index: destination.index,
      from: { parentId: node.parentId!, index: node.index! },
      to: { parentId, childCount: await countChildren(bookmarks, parentId) },
    });
    return withBookmarkNodeType(await move(id, { ...destination, index }));
  };
};

/**
 * Makes Chromium's `browser.bookmarks` behave like Firefox's, which the app
 * is written against (see ADR-0001). A no-op on Firefox.
 *
 * Each entry point (homepage, popup, background) is its own JavaScript
 * context with its own `browser` object, so each calls this once before use.
 */
export const installChromiumBookmarksShim = () => {
  if (typeof browser.runtime.getBrowserInfo === "function") return;
  addNodeTypes(browser.bookmarks);
  appendOutOfRangeCreates(browser.bookmarks);
  adoptFinalMoveIndexes(browser.bookmarks);
};
