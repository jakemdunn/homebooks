import {
  FC,
  PropsWithChildren,
  startTransition,
  useCallback,
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
  useFilterBookmarksByQuery,
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
  const [expandedIds, setExpanded] = useStorage(
    "expanded",
    [] as string[],
    "sync",
  );

  const dragState = useDragContext();

  const [bookmarks, setBookmarks] =
    useState<browser.Bookmarks.BookmarkTreeNode[]>();
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

  const currentEdit = useMemo(() => {
    if (editFocusId === undefined || bookmarks === undefined) return undefined;
    return findNodeById(bookmarks, editFocusId);
  }, [bookmarks, editFocusId]);
  console.log("currentEdit", editFocusId, currentEdit);

  const expandedSource = searchPeekedIds ?? expandedIds;
  const updateExpanded = useCallback(
    (updated: string[]) => {
      console.log("updateExpanded transition", updated);
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
      currentEdit,
      displayBookmarks,
      expandAll,
      expanded,
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
      searchQuery,
      setCurrentEdit,
      setSearchQuery,
      toggle,
    ],
  );

  return !!settings && <BookmarkContext.Provider value={value} {...props} />;
};
