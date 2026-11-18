import { hostsIn } from "../../src/util/siteIconRecorder";
import {
  SITE_ICONS_KEY,
  type SiteIconCache,
} from "../../src/util/siteIconCache";
import { createFakeBookmarks, type SeedNode } from "./bookmarks";
import { fakeI18n, fakeRuntime } from "./runtime";
import { createFakeStorage, type StoredValues } from "./storage";
import { createFakeTabs, type SeedWindow } from "./tabs";

export { OTHER_BOOKMARKS, type SeedNode } from "./bookmarks";
export type { SeedTab, SeedWindow } from "./tabs";

export type FakeBrowserSeed = {
  bookmarks?: SeedNode[];
  windows?: SeedWindow[];
  /**
   * Site Icons by host. Every other bookmarked host is cached as having
   * none, so it shows a letter tile and no story looks one up.
   */
  siteIcons?: Record<string, string>;
  /** Stored values by area. Folders marked `expanded` add to `sync.expanded`. */
  storage?: StoredValues;
};

/** A cached entry for every host: its icon if it has one, else "none". */
const createSiteIconCache = (
  hosts: string[],
  icons: Record<string, string>,
  seen: number,
): SiteIconCache =>
  Object.fromEntries(
    hosts.map((host) => [
      host,
      icons[host] ? { icon: icons[host], seen } : { seen },
    ]),
  );

/** The seed's stored values, plus its Site Icon cache and expanded Folders. */
const createStoredValues = (
  seed: FakeBrowserSeed,
  { hosts, expanded }: { hosts: string[]; expanded: string[] },
): StoredValues => {
  const sync = { ...seed.storage?.sync };
  if (expanded.length)
    sync.expanded = [
      ...((sync.expanded as string[] | undefined) ?? []),
      ...expanded,
    ];
  return {
    local: {
      [SITE_ICONS_KEY]: createSiteIconCache(
        hosts,
        seed.siteIcons ?? {},
        Date.now(),
      ),
      ...seed.storage?.local,
    },
    sync,
    session: seed.storage?.session,
  };
};

/**
 * An in-memory stand-in for `webextension-polyfill`'s `browser`, for
 * Storybook only. It behaves like Firefox, which the app is written against
 * (see ADR-0001 and ADR-0002).
 */
export const createFakeBrowser = (seed: FakeBrowserSeed = {}) => {
  const bookmarks = createFakeBookmarks();
  const tabs = createFakeTabs();
  const storage = createFakeStorage();

  /** Replaces every Bookmark, Window, Tab and stored value with `seed`'s. */
  const reset = (seed: FakeBrowserSeed = {}) => {
    const expanded = bookmarks.seed(seed.bookmarks ?? []);
    tabs.seed(seed.windows ?? []);
    const hosts = hostsIn(bookmarks.readTree());
    storage.seed(createStoredValues(seed, { hosts, expanded }));
  };

  const browser = {
    bookmarks: bookmarks.api,
    tabs: tabs.tabs,
    windows: tabs.windows,
    storage: storage.api,
    runtime: fakeRuntime,
    i18n: fakeI18n,
  };

  reset(seed);
  return { browser, reset };
};
