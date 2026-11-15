import { useEffect, useState } from "react";
import browser from "webextension-polyfill";
import { chooseRootFolder } from "./rootFolder";
import { useSettingsStorage } from "./storage.types";

/** The stored Root Folder's node, or undefined when it no longer exists. */
const getStoredFolder = async (id: string | undefined) => {
  if (!id) return undefined;
  try {
    return (await browser.bookmarks.get(id))[0];
  } catch {
    return undefined;
  }
};

const resolveRootFolder = async (storedId: string | undefined) => {
  const [storedFolder, [treeRoot]] = await Promise.all([
    getStoredFolder(storedId),
    browser.bookmarks.getTree(),
  ]);
  return chooseRootFolder(storedFolder, treeRoot?.children ?? []);
};

/**
 * The Root Folder in use: the Root Folder setting if that folder exists,
 * otherwise the browser's "Other Bookmarks" (see {@link chooseRootFolder}).
 * Undefined until resolved. Follows the setting, and falls back again if the
 * stored folder is deleted. Never writes the setting.
 */
export const useRootFolder = () => {
  const [settings] = useSettingsStorage();
  const storedId = settings?.rootFolder;
  const [rootFolder, setRootFolder] = useState<string>();

  useEffect(() => {
    let current = true;
    const update = async () => {
      const resolved = await resolveRootFolder(storedId);
      if (current) setRootFolder(resolved);
    };
    update();
    browser.bookmarks.onRemoved.addListener(update);
    return () => {
      current = false;
      browser.bookmarks.onRemoved.removeListener(update);
    };
  }, [storedId]);

  return rootFolder;
};
