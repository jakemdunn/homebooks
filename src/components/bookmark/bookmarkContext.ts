import { createContext, useContext } from "react";
import browser from "webextension-polyfill";

export interface BookmarkState {
  bookmarks?: browser.Bookmarks.BookmarkTreeNode[];
  /**
   * True until the live bookmarks and settings have arrived. Until then the
   * page may be showing their localStorage copies.
   */
  loading: boolean;
  expanded: string[];
  toggle: (folderId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  displayBookmarks?: browser.Bookmarks.BookmarkTreeNode[];
  currentEdit?: browser.Bookmarks.BookmarkTreeNode;
  setCurrentEdit: (node?: browser.Bookmarks.BookmarkTreeNode) => void;
}

export const BookmarkContext = createContext<BookmarkState>(
  {} as BookmarkState,
);
export const useBookmarkContext = () => useContext(BookmarkContext);
