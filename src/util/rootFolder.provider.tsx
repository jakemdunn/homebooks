import { FC, PropsWithChildren, useEffect, useState } from "react";
import browser from "webextension-polyfill";
import { RootFolderContext } from "./rootFolder.context";
import { resolveRootFolder } from "./rootFolder.bookmarks";
import { useSettingsStorage } from "./storage.types";

/**
 * Resolves the Root Folder in use once for the page: the Root Folder setting
 * if that folder exists, otherwise Other Bookmarks. Follows the setting, and
 * falls back again if the stored folder is deleted. Never writes the setting.
 */
export const RootFolderProvider: FC<PropsWithChildren> = ({ children }) => {
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

  return (
    <RootFolderContext.Provider value={rootFolder}>
      {children}
    </RootFolderContext.Provider>
  );
};
