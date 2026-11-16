import {
  parseSiteIconCache,
  SITE_ICONS_KEY,
  type SiteIconCache,
} from "./siteIconCache";

/** The `storage.local` calls the Site Icon cache needs. */
export type SiteIconStorageArea = {
  get: (key: string) => Promise<Record<string, unknown>>;
  set: (items: Record<string, unknown>) => Promise<void>;
};

/**
 * Changes the stored Site Icon cache. Each change reads, changes and writes
 * the whole cache, so the changes made through one updater queue.
 */
export const createSiteIconUpdater = (local: SiteIconStorageArea) => {
  let queue = Promise.resolve();
  return (change: (cache: SiteIconCache) => SiteIconCache) => {
    // A failed change mustn't block the ones after it.
    queue = queue
      .catch(() => {})
      .then(async () => {
        const saved = await local.get(SITE_ICONS_KEY);
        const cache = parseSiteIconCache(saved[SITE_ICONS_KEY]);
        await local.set({ [SITE_ICONS_KEY]: change(cache) });
      });
    return queue;
  };
};
