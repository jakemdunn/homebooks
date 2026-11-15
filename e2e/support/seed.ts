import type { Worker } from "@playwright/test";

/** A node to create under the Root Folder: a Folder when `children` is set. */
export type SeedNode =
  | { title: string; url: string }
  | { title: string; children: SeedNode[] };

/** The bookmark tree as titles: a Folder is `{ [title]: children }`. */
export type TitleTree = (string | { [folder: string]: TitleTree })[];

export type SeededRootFolder = {
  rootId: string;
  /** Bookmark and Folder ids by title. */
  ids: Record<string, string>;
};

/** The title of the Root Folder every test seeds. */
export const ROOT_FOLDER_TITLE = "Homebooks E2E Root";

/** Bookmarks titled `titles`, each with its own example URL. */
export const bookmarks = (...titles: string[]): SeedNode[] =>
  titles.map((title) => ({ title, url: urlFor(title) }));

export const urlFor = (title: string) =>
  `https://${title.toLowerCase().replace(/\s+/g, "-")}.example/`;

/**
 * Creates a fresh Root Folder holding `nodes` through the real bookmarks API
 * and points the Root Folder setting at it, with `expanded` Folders open.
 */
export const seedRootFolder = (
  serviceWorker: Worker,
  { nodes, expanded }: { nodes: SeedNode[]; expanded: string[] },
): Promise<SeededRootFolder> =>
  serviceWorker.evaluate(
    async ({ nodes, expanded, title }) => {
      const ids: Record<string, string> = {};
      const create = async (parentId: string, node: SeedNode) => {
        const { id } = await chrome.bookmarks.create({
          parentId,
          title: node.title,
          ...("url" in node && { url: node.url }),
        });
        ids[node.title] = id;
        if ("children" in node)
          for (const child of node.children) await create(id, child);
      };
      // "2" is Chromium's "Other Bookmarks".
      const root = await chrome.bookmarks.create({
        parentId: "2",
        title,
      });
      for (const node of nodes) await create(root.id, node);
      await chrome.storage.sync.set({
        settings: {
          rootFolder: root.id,
          contextMenus: "contextMenuOptionRightClick",
        },
        expanded: expanded.map((title) => ids[title]),
      });
      return { rootId: root.id, ids };
    },
    { nodes, expanded, title: ROOT_FOLDER_TITLE },
  );

/** The Root Folder's contents as titles, read through the real API. */
export const readBookmarkTree = (serviceWorker: Worker, rootId: string) =>
  serviceWorker.evaluate(async (rootId) => {
    type Node = chrome.bookmarks.BookmarkTreeNode;
    const toTitles = (node: Node): TitleTree[number] =>
      node.url
        ? node.title
        : { [node.title]: (node.children ?? []).map(toTitles) };
    const [root] = await chrome.bookmarks.getSubTree(rootId);
    return (root.children ?? []).map(toTitles);
  }, rootId);

/** URLs of every Bookmark under the Root Folder, by title. */
export const readBookmarkUrls = (serviceWorker: Worker, rootId: string) =>
  serviceWorker.evaluate(async (rootId) => {
    type Node = chrome.bookmarks.BookmarkTreeNode;
    const urls: Record<string, string> = {};
    const collect = (node: Node) => {
      if (node.url) urls[node.title] = node.url;
      node.children?.forEach(collect);
    };
    collect((await chrome.bookmarks.getSubTree(rootId))[0]);
    return urls;
  }, rootId);
