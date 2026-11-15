/** Firefox's id for its Other Bookmarks folder. */
const FIREFOX_OTHER_BOOKMARKS = "unfiled_____";
/** Chromium's `folderType` for its Other Bookmarks folder (Chromium 134+). */
const CHROMIUM_OTHER_BOOKMARKS_TYPE = "other";

type FolderCandidate = {
  id: string;
  url?: string;
  /** Chromium 134+ marks its built-in folders, e.g. "other". */
  folderType?: string;
};

/**
 * The Root Folder in use: the stored one if that folder exists, otherwise the
 * browser's "Other Bookmarks". Chromium documents no fixed id for it, so it's
 * found among the bookmark tree root's children: by Firefox's id, by
 * Chromium's `folderType`, or as the second child where Chromium predates
 * `folderType`.
 */
export const chooseRootFolder = (
  storedFolder: FolderCandidate | undefined,
  rootChildren: FolderCandidate[],
): string | undefined => {
  if (storedFolder && !storedFolder.url) return storedFolder.id;
  return (
    rootChildren.find(({ id }) => id === FIREFOX_OTHER_BOOKMARKS)?.id ??
    rootChildren.find(
      ({ folderType }) => folderType === CHROMIUM_OTHER_BOOKMARKS_TYPE,
    )?.id ??
    rootChildren[1]?.id
  );
};
