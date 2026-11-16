import type { Bookmarks, Tabs } from "webextension-polyfill";
import {
  forgetSiteIcons,
  hostOf,
  recordLookedUpSiteIcon,
  recordSiteIcon,
  tabSiteIcon,
  type FoundSiteIcon,
  type SiteIconCache,
} from "./siteIconCache";
import {
  createSiteIconUpdater,
  type SiteIconStorageArea,
} from "./siteIconStorage";

/** The parts of the extension API the recorder uses. */
export type SiteIconBrowser = {
  bookmarks: {
    search: (query: { query: string }) => Promise<Bookmarks.BookmarkTreeNode[]>;
    getTree: () => Promise<Bookmarks.BookmarkTreeNode[]>;
  };
  tabs: { query: (query: object) => Promise<Tabs.Tab[]> };
  storage: { local: SiteIconStorageArea };
};

/** The hosts of every Bookmark in `node`, Folders included. */
const hostsIn = (node: Bookmarks.BookmarkTreeNode): string[] => {
  const host = hostOf(node.url);
  return [...(host ? [host] : []), ...(node.children ?? []).flatMap(hostsIn)];
};

/**
 * The only writer of the Site Icon cache, so changes from pages and
 * browser events never overwrite each other. It keeps the cache to
 * bookmarked hosts and never records a private-window Tab's icon.
 */
export const createSiteIconRecorder = (
  browser: SiteIconBrowser,
  now: () => number = Date.now,
) => {
  const update = createSiteIconUpdater(browser.storage.local);

  const isBookmarked = async (host: string) =>
    (await browser.bookmarks.search({ query: host })).some(
      ({ url }) => hostOf(url) === host,
    );

  const bookmarkedOnly = async (found: FoundSiteIcon[]) => {
    const kept: FoundSiteIcon[] = [];
    for (const icon of found)
      if (await isBookmarked(icon.host)) kept.push(icon);
    return kept;
  };

  /** Records Tab icons for the hosts that have a Bookmark. */
  const recordTabIcons = async (found: FoundSiteIcon[]) => {
    const kept = await bookmarkedOnly(found);
    if (!kept.length) return;
    await update((cache) =>
      kept.reduce<SiteIconCache>(
        (next, { host, icon }) =>
          icon ? recordSiteIcon(next, host, icon, now()) : next,
        cache,
      ),
    );
  };

  /** Takes a Bookmark's icon from any open Tab on its host. */
  const takeOpenTabIcon = async (url: string | undefined) => {
    const host = hostOf(url);
    if (!host) return;
    const open = (await browser.tabs.query({}))
      .map(tabSiteIcon)
      .find((icon) => icon?.host === host);
    if (open) await recordTabIcons([open]);
  };

  /** Forgets every host no Bookmark has any more. */
  const forgetUnbookmarked = async () => {
    const bookmarked = new Set(
      (await browser.bookmarks.getTree()).flatMap(hostsIn),
    );
    await update((cache) =>
      forgetSiteIcons(
        cache,
        Object.keys(cache).filter((host) => !bookmarked.has(host)),
      ),
    );
  };

  return {
    tabUpdated: async (tab: Tabs.Tab) => {
      const found = tabSiteIcon(tab);
      if (found) await recordTabIcons([found]);
    },

    /** Tabs just made into Bookmarks, which may already have closed. */
    tabsBookmarked: (found: FoundSiteIcon[]) => recordTabIcons(found),

    /** What pages found looking hosts up. */
    lookedUp: async (found: FoundSiteIcon[]) => {
      const kept = await bookmarkedOnly(found);
      if (!kept.length) return;
      await update((cache) =>
        kept.reduce<SiteIconCache>(
          (next, icon) => recordLookedUpSiteIcon(next, icon, now()),
          cache,
        ),
      );
    },

    bookmarkCreated: (bookmark: Bookmarks.BookmarkTreeNode) =>
      takeOpenTabIcon(bookmark.url),

    bookmarkRemoved: () => forgetUnbookmarked(),

    /** A Bookmark's URL changed, so its old host may have no Bookmark now. */
    bookmarkChanged: async ({ url }: { url?: string }) => {
      if (!url) return;
      await forgetUnbookmarked();
      await takeOpenTabIcon(url);
    },
  };
};
