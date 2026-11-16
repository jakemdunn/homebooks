import { FC, PropsWithChildren, useEffect, useState } from "react";
import browser from "webextension-polyfill";
import { RootFolderContext } from "./rootFolder.context";
import { resolveRootFolder } from "./rootFolder.bookmarks";
import { useSettingsStorage } from "./storage.types";
import { cachedRootFolder, writeCachedRootFolder } from "./bookmarkCache";

/**
 * Resolves the Root Folder in use once for the page: the Root Folder setting
 * if that folder exists, otherwise Other Bookmarks. Follows the setting, and
 * falls back again if the stored folder is deleted. Never writes the setting.
 *
 * Starts from the Root Folder last resolved for the same setting (see
 * bookmarkCache), so a new tab can render before the bookmarks API answers.
 */
export const RootFolderProvider: FC<PropsWithChildren> = ({ children }) => {
  const [settings, , settingsLoaded] = useSettingsStorage();
  const storedId = settings?.rootFolder;
  const [rootFolder, setRootFolder] = useState(() =>
    settingsLoaded ? cachedRootFolder(storedId) : undefined,
  );

  useEffect(() => {
    // Resolving the default setting before storage answers would be thrown away.
    if (!settingsLoaded) return;
    let current = true;
    const update = async () => {
      const resolved = await resolveRootFolder(storedId);
      if (!current) return;
      setRootFolder(resolved);
      if (resolved) writeCachedRootFolder({ storedId, rootFolder: resolved });
    };
    update();
    browser.bookmarks.onRemoved.addListener(update);
    return () => {
      current = false;
      browser.bookmarks.onRemoved.removeListener(update);
    };
  }, [storedId, settingsLoaded]);

  return (
    <RootFolderContext.Provider value={rootFolder}>
      {children}
    </RootFolderContext.Provider>
  );
};
