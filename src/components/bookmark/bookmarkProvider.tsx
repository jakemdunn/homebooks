import {
  FC,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import browser from "webextension-polyfill";
import { BookmarkState, BookmarkContext } from "./bookmarkContext";
import { useDragContext } from "../drag/dragContext";
import { parseDragId } from "../drag/dragProvider.util";
import { useSettingsStorage } from "../../util/storage.types";
import {
  collectBookmarkSearchTargets,
  useFilterBookmarksByQuery,
} from "./bookmarkSearch";
import { useStorage, useStorageAnswered } from "../../util/useStorage";
import equal from "fast-deep-equal";
import { useRootFolder } from "../../util/rootFolder.context";
import { startRegionTransition } from "../../util/viewTransitionRegion";
import { getRootFolderSubTree } from "../../util/rootFolder.bookmarks";
import {
  cachedBookmarks,
  writeCachedBookmarks,
} from "../../util/bookmarkCache";

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

function findNodeById(
  nodes: browser.Bookmarks.BookmarkTreeNode[] | undefined,
  id: string,
): browser.Bookmarks.BookmarkTreeNode | undefined {
  if (!nodes?.length) return undefined;
  for (const node of nodes) {
    if (node.id === id) return node;
    const nested = findNodeById(node.children, id);
    if (nested) return nested;
  }
  return undefined;
}

export const BookmarkProvider: FC<PropsWithChildren> = (props) => {
  const [settings] = useSettingsStorage();
  const rootFolder = useRootFolder();
  const [expandedIds, setExpanded] = useStorage(
    "expanded",
    [] as string[],
    "sync",
  );

  const dragState = useDragContext();

  // Starts from the bookmarks last read for this Root Folder, if any, so a
  // new tab shows them before the bookmarks API answers.
  const [bookmarks, setBookmarks] = useState<
    browser.Bookmarks.BookmarkTreeNode[] | undefined
  >(() => cachedBookmarks(rootFolder));
  const [editFocusId, setEditFocusId] = useState<string | undefined>(undefined);
  const setCurrentEdit = useCallback(
    (node?: browser.Bookmarks.BookmarkTreeNode) => {
      setEditFocusId(node?.id);
    },
    [],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const searchActive = useMemo(
    () => searchQuery.trim().length > 0,
    [searchQuery],
  );
  const searchTargets = useMemo(
    () => collectBookmarkSearchTargets(bookmarks),
    [bookmarks],
  );
  const [displayBookmarks, searchFolderIdsToExpand] = useFilterBookmarksByQuery(
    bookmarks,
    searchQuery,
    searchTargets,
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

  const hasLiveBookmarks = useRef(false);
  const [showingLiveBookmarks, setShowingLiveBookmarks] = useState(false);
  const settingsAnswered = useStorageAnswered("settings", "sync");
  const expandedAnswered = useStorageAnswered("expanded", "sync");
  const loading =
    !showingLiveBookmarks || !settingsAnswered || !expandedAnswered;
  /**
   * The first live read renders directly, replacing any cached bookmarks
   * without a view transition; later changes animate the Bookmarks column.
   */
  const showLiveBookmarks = useCallback(
    (children: browser.Bookmarks.BookmarkTreeNode[]) => {
      const update = () =>
        setBookmarks((shown) => (equal(shown, children) ? shown : children));
      if (hasLiveBookmarks.current)
        startRegionTransition(["bookmarks"], update);
      else update();
      hasLiveBookmarks.current = true;
      setShowingLiveBookmarks(true);
    },
    [],
  );

  useEffect(() => {
    // Set false once this Root Folder is replaced, so a read still in flight
    // for it can't overwrite the new one's bookmarks or cache.
    let current = true;
    const updateBookmarks = async () => {
      if (!rootFolder) return;
      const tree = await getRootFolderSubTree(rootFolder);
      if (!current || !tree?.children) return;
      const children = tree.children;
      writeCachedBookmarks({ rootFolder, children });
      showLiveBookmarks(children);
    };
    updateBookmarks();

    browser.bookmarks.onChanged.addListener(updateBookmarks);
    browser.bookmarks.onCreated.addListener(updateBookmarks);
    browser.bookmarks.onMoved.addListener(updateBookmarks);
    browser.bookmarks.onRemoved.addListener(updateBookmarks);

    return () => {
      current = false;
      browser.bookmarks.onChanged.removeListener(updateBookmarks);
      browser.bookmarks.onCreated.removeListener(updateBookmarks);
      browser.bookmarks.onMoved.removeListener(updateBookmarks);
      browser.bookmarks.onRemoved.removeListener(updateBookmarks);
    };
  }, [rootFolder, showLiveBookmarks]);

  const currentEdit = useMemo(() => {
    if (editFocusId === undefined || bookmarks === undefined) return undefined;
    return findNodeById(bookmarks, editFocusId);
  }, [bookmarks, editFocusId]);

  const expandedSource = searchPeekedIds ?? expandedIds;
  const updateExpanded = useCallback(
    (updated: string[]) => {
      startRegionTransition(["bookmarks"], () => {
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
      ...new Set<string>([
        ...expandedSource,
        ...Array.from(dragState.peekedIds).map(
          (peekedId) => parseDragId(peekedId)[1],
        ),
      ]).values(),
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
      currentEdit,
      displayBookmarks,
      expandAll,
      expanded,
      loading,
      searchQuery,
      setCurrentEdit,
      setSearchQuery,
      toggle,
    }),
    [
      bookmarks,
      collapseAll,
      currentEdit,
      displayBookmarks,
      expandAll,
      expanded,
      loading,
      searchQuery,
      setCurrentEdit,
      setSearchQuery,
      toggle,
    ],
  );

  return !!settings && <BookmarkContext.Provider value={value} {...props} />;
};
