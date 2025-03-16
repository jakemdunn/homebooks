import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import browser from "webextension-polyfill";
import { useDragContext } from "../drag/dragContext";
import { useSettingsStorage } from "../settings/settings";

interface BookmarkState {
  bookmarks?: browser.Bookmarks.BookmarkTreeNode[];
  expanded: string[];
  toggle: (folderId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
}

const BookmarkContext = createContext<BookmarkState>({} as BookmarkState);
export const useBookmarkContext = () => useContext(BookmarkContext);

export const BookmarkProvider: FC<PropsWithChildren> = (props) => {
  const [storeExpanded, setExpanded] = useState<string[]>([]);
  const dragState = useDragContext();
  const expanded = useMemo(
    () => [
      ...new Set<string>([...storeExpanded, ...dragState.peekedIds]).values(),
    ],
    [dragState.peekedIds, storeExpanded]
  );
  const [bookmarks, setBookmarks] =
    useState<browser.Bookmarks.BookmarkTreeNode[]>();
  const allFolderIds = bookmarks?.map((node) => node.id);
  const [settings] = useSettingsStorage();

  useEffect(() => {
    const updateBookmarks = async () => {
      if (!settings?.rootFolder) return;
      const tree = await browser.bookmarks.getSubTree(settings.rootFolder);
      setBookmarks(tree[0].children);
    };
    updateBookmarks();

    browser.bookmarks.onChanged.addListener(updateBookmarks);
    browser.bookmarks.onCreated.addListener(updateBookmarks);
    browser.bookmarks.onMoved.addListener(updateBookmarks);
    browser.bookmarks.onRemoved.addListener(updateBookmarks);

    return () => {
      browser.bookmarks.onChanged.removeListener(updateBookmarks);
      browser.bookmarks.onCreated.removeListener(updateBookmarks);
      browser.bookmarks.onMoved.removeListener(updateBookmarks);
      browser.bookmarks.onRemoved.removeListener(updateBookmarks);
    };
  }, [settings?.rootFolder]);

  useEffect(() => {
    const updateStorage = async () => {
      const stored = (await browser.storage.sync.get("expanded")) as {
        expanded: string[];
      };
      setExpanded(stored.expanded ?? []);
    };
    updateStorage();

    browser.storage.sync.onChanged.addListener(updateStorage);

    return () => {
      browser.bookmarks.onChanged.removeListener(updateStorage);
    };
  }, []);

  const toggle = useCallback(
    async (folderId: string) => {
      await browser.storage.sync.set({
        expanded: expanded.includes(folderId)
          ? expanded.filter((id) => id !== folderId)
          : [...expanded, folderId],
      });
    },
    [expanded]
  );

  const expandAll = useCallback(async () => {
    await browser.storage.sync.set({
      expanded: allFolderIds,
    });
  }, [allFolderIds]);
  const collapseAll = useCallback(async () => {
    await browser.storage.sync.set({
      expanded: [],
    });
  }, []);

  const value = useMemo<BookmarkState>(
    () => ({
      bookmarks,
      collapseAll,
      expandAll,
      expanded,
      toggle,
    }),
    [bookmarks, expanded, toggle, expandAll, collapseAll]
  );

  return !!settings && <BookmarkContext.Provider value={value} {...props} />;
};
