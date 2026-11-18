import type { Bookmarks } from "webextension-polyfill";
import { copy, createEvent, renumber } from "./events";

export type BookmarkNode = Bookmarks.BookmarkTreeNode;

/** A node to put under Other Bookmarks: a Folder when `children` is set. */
export type SeedNode =
  | { title: string; url: string }
  | { title: string; children: SeedNode[]; expanded?: boolean };

/** Firefox's fixed ids for the bookmark tree's root and its built-in Folders. */
const ROOT = "root________";
export const OTHER_BOOKMARKS = "unfiled_____";
const BUILT_IN_FOLDERS = [
  ["menu________", "Bookmarks Menu"],
  ["toolbar_____", "Bookmarks Toolbar"],
  [OTHER_BOOKMARKS, "Other Bookmarks"],
  ["mobile______", "Mobile Bookmarks"],
] as const;

/** A fixed date, so screenshots never depend on when a story ran. */
const DATE_ADDED = Date.UTC(2026, 0, 1);

const createFolderNode = (
  id: string,
  title: string,
  parentId?: string,
): BookmarkNode => ({
  id,
  parentId,
  title,
  type: "folder",
  dateAdded: DATE_ADDED,
  children: [],
});

const createBookmarkNode = (
  id: string,
  title: string,
  url: string,
): BookmarkNode => ({
  id,
  title,
  url,
  type: "bookmark",
  dateAdded: DATE_ADDED,
});

const createBuiltInTree = () => {
  const root = createFolderNode(ROOT, "");
  root.children = BUILT_IN_FOLDERS.map(([id, title]) =>
    createFolderNode(id, title, ROOT),
  );
  renumber(root.children);
  return root;
};

/** The first of `nodes`, or of their descendants, that `matches`. */
export const findNode = (
  nodes: BookmarkNode[] | undefined,
  matches: (node: BookmarkNode) => boolean,
): BookmarkNode | undefined => {
  for (const node of nodes ?? []) {
    if (matches(node)) return node;
    const found = findNode(node.children, matches);
    if (found) return found;
  }
  return undefined;
};

/** `browser.bookmarks`, in memory, behaving like Firefox's. */
export const createFakeBookmarks = () => {
  let root = createBuiltInTree();
  let nextId = 1;
  const events = {
    onCreated: createEvent<[id: string, node: BookmarkNode]>(),
    onMoved: createEvent<[id: string, info: Bookmarks.OnMovedMoveInfoType]>(),
    onChanged:
      createEvent<[id: string, info: Bookmarks.OnChangedChangeInfoType]>(),
    onRemoved:
      createEvent<[id: string, info: Bookmarks.OnRemovedRemoveInfoType]>(),
  };

  const getNode = (id: string) => {
    const node = findNode([root], (node) => node.id === id);
    if (!node) throw new Error(`Can't find bookmark for id: ${id}`);
    return node;
  };

  const attachNode = (
    parent: BookmarkNode,
    node: BookmarkNode,
    index: number,
  ) => {
    parent.children!.splice(index, 0, node);
    node.parentId = parent.id;
    renumber(parent.children!);
  };

  /** Takes `node` out of its Folder, and returns that Folder. */
  const detachNode = (node: BookmarkNode) => {
    const parent = getNode(node.parentId!);
    parent.children!.splice(node.index!, 1);
    renumber(parent.children!);
    return parent;
  };

  const insertNode = (
    parent: BookmarkNode,
    { title, url }: { title: string; url?: string },
    index = parent.children!.length,
  ) => {
    const id = String(nextId++);
    const node =
      url === undefined
        ? createFolderNode(id, title)
        : createBookmarkNode(id, title, url);
    attachNode(parent, node, index);
    return node;
  };

  const removeNode = (node: BookmarkNode) => {
    const index = node.index!;
    const parent = detachNode(node);
    events.onRemoved.emit(node.id, {
      parentId: parent.id,
      index,
      node: copy(node),
    });
  };

  /**
   * Replaces every Bookmark with `nodes`, under Other Bookmarks. Returns
   * the ids of the Folders marked `expanded`.
   */
  const seed = (nodes: SeedNode[]) => {
    root = createBuiltInTree();
    nextId = 1;
    const expanded: string[] = [];
    const addSeedNode = (parent: BookmarkNode, entry: SeedNode) => {
      const url = "url" in entry ? entry.url : undefined;
      const node = insertNode(parent, { title: entry.title, url });
      if (!("children" in entry)) return;
      if (entry.expanded) expanded.push(node.id);
      entry.children.forEach((child) => addSeedNode(node, child));
    };
    nodes.forEach((entry) => addSeedNode(getNode(OTHER_BOOKMARKS), entry));
    return expanded;
  };

  const api = {
    ...events,
    get: async (idOrIds: string | string[]) =>
      [idOrIds].flat().map((id) => copy(getNode(id))),
    getTree: async () => [copy(root)],
    getSubTree: async (id: string) => [copy(getNode(id))],
    create: async ({
      parentId = OTHER_BOOKMARKS,
      index,
      title = "",
      url,
    }: Bookmarks.CreateDetails) => {
      const node = insertNode(getNode(parentId), { title, url }, index);
      events.onCreated.emit(node.id, copy(node));
      return copy(node);
    },
    update: async (id: string, { title, url }: Bookmarks.UpdateChangesType) => {
      const node = getNode(id);
      if (title !== undefined) node.title = title;
      if (url !== undefined && node.url !== undefined) node.url = url;
      events.onChanged.emit(id, { title: node.title, url: node.url });
      return copy(node);
    },
    move: async (id: string, destination: Bookmarks.MoveDestinationType) => {
      const node = getNode(id);
      const oldIndex = node.index!;
      const oldParent = detachNode(node);
      const parent = getNode(destination.parentId ?? oldParent.id);
      // Firefox's index is where the node ends up, after it was taken out.
      const index = Math.min(
        destination.index ?? Infinity,
        parent.children!.length,
      );
      attachNode(parent, node, index);
      const info = {
        parentId: parent.id,
        index,
        oldParentId: oldParent.id,
        oldIndex,
      };
      events.onMoved.emit(id, info);
      return copy(node);
    },
    remove: async (id: string) => {
      const node = getNode(id);
      if (node.children?.length)
        throw new Error(`Can't remove a non-empty Folder: ${id}`);
      removeNode(node);
    },
    removeTree: async (id: string) => removeNode(getNode(id)),
  };

  return { api, seed, readTree: () => root };
};
