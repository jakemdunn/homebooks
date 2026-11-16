import type { Bookmarks } from "webextension-polyfill";
import {
  type LocalStore,
  isRecord,
  readLocalJson,
  writeLocalJson,
} from "./localStore";

/**
 * The last Root Folder and bookmarks a page read, kept in localStorage so a
 * new tab can show them on its first frame, before `browser.bookmarks`
 * answers. The live reads then replace them.
 */
const ROOT_FOLDER_KEY = "homebooks.rootFolder";
const BOOKMARKS_KEY = "homebooks.bookmarks";

type RootFolderEntry = {
  /** The Root Folder setting the Root Folder was resolved from. */
  storedId?: string;
  rootFolder: string;
};
type BookmarksEntry = {
  rootFolder: string;
  children: Bookmarks.BookmarkTreeNode[];
};

/** The entry saved under `key`, if it names a Root Folder. */
const readEntry = (key: string, store?: LocalStore) => {
  const saved = readLocalJson(key, store);
  return isRecord(saved) && typeof saved.rootFolder === "string"
    ? saved
    : undefined;
};

export const writeCachedRootFolder = (
  entry: RootFolderEntry,
  store?: LocalStore,
) => writeLocalJson(ROOT_FOLDER_KEY, entry, store);

/** The Root Folder last resolved from this Root Folder setting. */
export const cachedRootFolder = (
  storedId: string | undefined,
  store?: LocalStore,
): string | undefined => {
  const entry = readEntry(ROOT_FOLDER_KEY, store);
  return entry && entry.storedId === storedId
    ? (entry.rootFolder as string)
    : undefined;
};

export const writeCachedBookmarks = (
  entry: BookmarksEntry,
  store?: LocalStore,
) => writeLocalJson(BOOKMARKS_KEY, entry, store);

/** The Root Folder's children as last read, if they're for this Root Folder. */
export const cachedBookmarks = (
  rootFolder: string | undefined,
  store?: LocalStore,
): Bookmarks.BookmarkTreeNode[] | undefined => {
  const entry = readEntry(BOOKMARKS_KEY, store);
  if (!rootFolder || entry?.rootFolder !== rootFolder) return undefined;
  return Array.isArray(entry.children)
    ? (entry.children as Bookmarks.BookmarkTreeNode[])
    : undefined;
};
