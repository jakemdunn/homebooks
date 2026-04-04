import {
  FC,
  PropsWithChildren,
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import browser from "webextension-polyfill";
import { BookmarkState, BookmarkContext } from "./bookmarkContext";
import { useDragContext } from "../drag/dragContext";
import { useSettingsStorage } from "../../util/storage.types";
import {
  collectBookmarkSearchTargets,
  filterBookmarksByQuery,
} from "./bookmarkSearch";
import { useStorage } from "../../util/useStorage";

function collectFolderIds(
  nodes: browser.Bookmarks.BookmarkTreeNode[] | undefined,
): string[] {
  if (!nodes?.length) return [];
  return nodes.flatMap((node) => {
    const folderId = node.type === "folder" ? [node.id] : [];
    const nested = collectFolderIds(node.children);
    return [...folderId, ...nested];
  });
}

export const BookmarkProvider: FC<PropsWithChildren> = (props) => {
  const [settings] = useSettingsStorage();
  const [expandedIds, setExpanded] = useStorage(
    "expanded",
    [] as string[],
    "sync",
  );

  const dragState = useDragContext();

  const [bookmarks, setBookmarks] =
    useState<browser.Bookmarks.BookmarkTreeNode[]>();
  const [searchQuery, setSearchQuery] = useState("");
  const searchActive = useMemo(
    () => searchQuery.trim().length > 0,
    [searchQuery],
  );
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const searchTargets = useMemo(
    () => collectBookmarkSearchTargets(bookmarks),
    [bookmarks],
  );
  const [displayBookmarks, searchFolderIdsToExpand] = useMemo(
    () => filterBookmarksByQuery(bookmarks, deferredSearchQuery, searchTargets),
    [bookmarks, deferredSearchQuery, searchTargets],
  );
  const allFolderIds = useMemo(
    () => (bookmarks ? collectFolderIds(bookmarks) : undefined),
    [bookmarks],
  );

  const [searchPeekedIds, setSearchPeekedIds] = useState<
    string[] | undefined
  >();
  useEffect(() => {
    if (!searchQuery.trim().length) {
      setSearchPeekedIds(undefined);
      return;
    }

    setSearchPeekedIds([...searchFolderIdsToExpand]);
  }, [searchQuery, searchFolderIdsToExpand]);

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

  const expandedSource = searchPeekedIds ?? expandedIds;
  const updateExpanded = useCallback(
    (updated: string[]) => {
      startTransition(() => {
        if (searchActive) {
          setSearchPeekedIds(updated);
        } else {
          setExpanded(updated);
        }
      });
    },
    [searchActive, setExpanded],
  );

  const expanded = useMemo(
    () => [
      ...new Set<string>([...expandedSource, ...dragState.peekedIds]).values(),
    ],
    [dragState.peekedIds, expandedSource],
  );

  const toggle = useCallback(
    async (folderId: string) => {
      updateExpanded(
        expanded.includes(folderId)
          ? expanded.filter((id) => id !== folderId)
          : [...expanded, folderId],
      );
    },
    [expanded, updateExpanded],
  );

  const expandAll = useCallback(async () => {
    updateExpanded(allFolderIds ?? []);
  }, [allFolderIds, updateExpanded]);

  const collapseAll = useCallback(async () => {
    updateExpanded([]);
  }, [updateExpanded]);

  const value = useMemo<BookmarkState>(
    () => ({
      bookmarks,
      collapseAll,
      deferredSearchQuery,
      displayBookmarks,
      expandAll,
      expanded,
      searchQuery,
      setSearchQuery,
      toggle,
    }),
    [
      bookmarks,
      collapseAll,
      deferredSearchQuery,
      displayBookmarks,
      expandAll,
      expanded,
      searchQuery,
      setSearchQuery,
      toggle,
    ],
  );

  return !!settings && <BookmarkContext.Provider value={value} {...props} />;
};
