import fuzzysort from "fuzzysort";
import { useDeferredValue, useMemo } from "react";
import browser from "webextension-polyfill";

export interface BookmarkSearchTarget {
  node: browser.Bookmarks.BookmarkTreeNode;
  searchText: string;
}

export function collectBookmarkSearchTargets(
  nodes: browser.Bookmarks.BookmarkTreeNode[] | undefined,
  out: BookmarkSearchTarget[] = [],
): BookmarkSearchTarget[] {
  if (!nodes?.length) return out;
  for (const node of nodes) {
    if (node.type === "separator") continue;
    if (node.url) {
      out.push({
        node,
        searchText: `${node.title}\n${node.url}`,
      });
    } else if (node.children) {
      out.push({ node, searchText: node.title });
      collectBookmarkSearchTargets(node.children, out);
    }
  }
  return out;
}

function pruneBookmarkTreeByMatches(
  nodes: browser.Bookmarks.BookmarkTreeNode[] | undefined,
  matchedIds: ReadonlySet<string>,
): browser.Bookmarks.BookmarkTreeNode[] {
  if (!nodes?.length) return [];
  const out: browser.Bookmarks.BookmarkTreeNode[] = [];

  for (const node of nodes) {
    if (node.type === "separator") continue;
    if (node.url) {
      if (matchedIds.has(node.id)) out.push(node);
      continue;
    }
    if (node.children) {
      if (matchedIds.has(node.id)) {
        out.push({ ...node, children: node.children });
      } else {
        const kids = pruneBookmarkTreeByMatches(node.children, matchedIds);
        if (kids.length > 0) {
          out.push({ ...node, children: kids });
        }
      }
    }
  }
  return out;
}

function scoresFromFuzzysortResults(
  results: ReadonlyArray<{ score: number; obj: BookmarkSearchTarget }>,
): Map<string, number> {
  const byId = new Map<string, number>();
  for (const r of results) {
    const id = r.obj.node.id;
    const prev = byId.get(id);
    byId.set(id, prev === undefined ? r.score : Math.max(prev, r.score));
  }
  return byId;
}

/** Best score in subtree (node’s own match score vs max among descendants). */
function fillBubbleScores(
  node: browser.Bookmarks.BookmarkTreeNode,
  selfScoreById: ReadonlyMap<string, number>,
  bubbleById: Map<string, number>,
): number {
  if (node.type === "separator") return 0;
  if (node.url) {
    const s = selfScoreById.get(node.id) ?? 0;
    bubbleById.set(node.id, s);
    return s;
  }
  let m = selfScoreById.get(node.id) ?? 0;
  if (node.children?.length) {
    for (const c of node.children) {
      m = Math.max(m, fillBubbleScores(c, selfScoreById, bubbleById));
    }
  }
  bubbleById.set(node.id, m);
  return m;
}

function fillBubbleScoresForForest(
  roots: browser.Bookmarks.BookmarkTreeNode[],
  selfScoreById: ReadonlyMap<string, number>,
): Map<string, number> {
  const bubbleById = new Map<string, number>();
  for (const root of roots) {
    fillBubbleScores(root, selfScoreById, bubbleById);
  }
  return bubbleById;
}

function compareByBubbleThenIndex(
  a: browser.Bookmarks.BookmarkTreeNode,
  b: browser.Bookmarks.BookmarkTreeNode,
  bubbleById: ReadonlyMap<string, number>,
): number {
  const db = (bubbleById.get(b.id) ?? 0) - (bubbleById.get(a.id) ?? 0);
  if (db !== 0) return db;
  return (a.index ?? 0) - (b.index ?? 0);
}

function sortSubtreeByBubble(
  node: browser.Bookmarks.BookmarkTreeNode,
  bubbleById: ReadonlyMap<string, number>,
): browser.Bookmarks.BookmarkTreeNode {
  if (node.type === "separator" || node.url || !node.children?.length) {
    return node;
  }
  const sortedChildren = [...node.children]
    .filter((c) => c.type !== "separator")
    .sort((a, b) => compareByBubbleThenIndex(a, b, bubbleById))
    .map((c) => sortSubtreeByBubble(c, bubbleById));
  return { ...node, children: sortedChildren };
}

function sortForestByBubble(
  roots: browser.Bookmarks.BookmarkTreeNode[],
  bubbleById: ReadonlyMap<string, number>,
): browser.Bookmarks.BookmarkTreeNode[] {
  return [...roots]
    .sort((a, b) => compareByBubbleThenIndex(a, b, bubbleById))
    .map((n) => sortSubtreeByBubble(n, bubbleById));
}

/**
 * URL bookmarks and folders with a fuzzy score above this get their ancestor chain
 * expanded while searching; matching folders also include their own id so they open.
 */
export const SEARCH_URL_EXPAND_SCORE_THRESHOLD = 0.5;

export type BookmarkSearchFilterResult = [
  displayBookmarks: browser.Bookmarks.BookmarkTreeNode[] | undefined,
  /** Folder IDs to expand: ancestors of strong URL hits, plus strong-matching folders (see {@link SEARCH_URL_EXPAND_SCORE_THRESHOLD}). */
  searchFolderIdsToExpand: string[],
];

function folderIdsToExpandForStrongSearchMatches(
  bookmarks: browser.Bookmarks.BookmarkTreeNode[] | undefined,
  results: ReadonlyArray<{ score: number; obj: BookmarkSearchTarget }>,
): string[] {
  if (!bookmarks?.length) return [];

  const scoreById = new Map<string, number>();
  for (const r of results) {
    const id = r.obj.node.id;
    const prev = scoreById.get(id);
    scoreById.set(id, prev === undefined ? r.score : Math.max(prev, r.score));
  }

  const folderIds = new Set<string>();
  const walk = (
    nodes: browser.Bookmarks.BookmarkTreeNode[] | undefined,
    ancestors: string[],
  ) => {
    if (!nodes?.length) return;
    for (const node of nodes) {
      if (node.type === "separator") continue;
      if (node.url) {
        const s = scoreById.get(node.id);
        if (s !== undefined && s > SEARCH_URL_EXPAND_SCORE_THRESHOLD) {
          for (const fid of ancestors) folderIds.add(fid);
        }
      } else if (node.children) {
        const s = scoreById.get(node.id);
        if (s !== undefined && s > SEARCH_URL_EXPAND_SCORE_THRESHOLD) {
          for (const fid of ancestors) folderIds.add(fid);
          folderIds.add(node.id);
        }
        walk(node.children, [...ancestors, node.id]);
      }
    }
  };
  walk(bookmarks, []);
  return [...folderIds];
}

export function useFilterBookmarksByQuery(
  bookmarks: browser.Bookmarks.BookmarkTreeNode[] | undefined,
  query: string,
  targets: BookmarkSearchTarget[],
): BookmarkSearchFilterResult {
  const deferredQuery = useDeferredValue(query.trim());
  return useMemo(() => {
    if (!bookmarks?.length || !deferredQuery) return [bookmarks, []];
    const results = fuzzysort.go(deferredQuery, targets, { key: "searchText" });
    const matchedIds = new Set(results.map((r) => r.obj.node.id));
    const pruned = pruneBookmarkTreeByMatches(bookmarks, matchedIds);
    const selfScoreById = scoresFromFuzzysortResults(results);
    const bubbleById = fillBubbleScoresForForest(pruned, selfScoreById);
    const displayBookmarks = sortForestByBubble(pruned, bubbleById);
    const searchFolderIdsToExpand = folderIdsToExpandForStrongSearchMatches(
      bookmarks,
      results,
    );
    return [displayBookmarks, searchFolderIdsToExpand];
  }, [bookmarks, deferredQuery, targets]);
}
