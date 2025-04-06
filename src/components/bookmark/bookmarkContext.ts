import { createContext, useContext } from "react";
import browser from "webextension-polyfill";

export interface BookmarkState {
  bookmarks?: browser.Bookmarks.BookmarkTreeNode[];
  expanded: string[];
  toggle: (folderId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
}

export const BookmarkContext = createContext<BookmarkState>(
  {} as BookmarkState
);
export const useBookmarkContext = () => useContext(BookmarkContext);
