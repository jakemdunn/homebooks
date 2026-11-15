import browser from "webextension-polyfill";
import { chooseRootFolder } from "./rootFolder";

/** A bookmark node by id, or undefined when it no longer exists. */
const getExistingNode = async (id: string | undefined) => {
  if (!id) return undefined;
  try {
    return (await browser.bookmarks.get(id))[0];
  } catch {
    return undefined;
  }
};

/** The Root Folder in use for the stored setting (see {@link chooseRootFolder}). */
export const resolveRootFolder = async (storedId: string | undefined) => {
  const [storedFolder, [treeRoot]] = await Promise.all([
    getExistingNode(storedId),
    browser.bookmarks.getTree(),
  ]);
  return chooseRootFolder(storedFolder, treeRoot?.children ?? []);
};

/**
 * The Root Folder's subtree, or undefined when that folder has just been
 * deleted: RootFolderProvider then falls back, and readers run again for
 * the new Root Folder. Any other failure still throws.
 */
export const getRootFolderSubTree = async (rootFolder: string) => {
  try {
    return (await browser.bookmarks.getSubTree(rootFolder))[0];
  } catch (error) {
    if (await getExistingNode(rootFolder)) throw error;
    return undefined;
  }
};
