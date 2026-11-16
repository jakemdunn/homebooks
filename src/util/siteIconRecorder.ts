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
 * Writes the Site Icon cache, keeping it to bookmarked hosts and never
 * recording a private-window Tab's icon. The background's recorder is the
 * cache's one writer; a page runs its own only when the background doesn't
 * answer, and the two can then overwrite each other's changes.
 */
export const createSiteIconRecorder = (
  browser: SiteIconBrowser,
  now: () => number = Date.now,
) => {
  const update = createSiteIconUpdater(browser.storage.local);

  /** Every host a Bookmark has, read in one call. */
  const bookmarkedHosts = async () =>
    new Set((await browser.bookmarks.getTree()).flatMap(hostsIn));

  const bookmarkedOnly = async (found: FoundSiteIcon[]) => {
    if (!found.length) return [];
    const bookmarked = await bookmarkedHosts();
    return found.filter(({ host }) => bookmarked.has(host));
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
    const bookmarked = await bookmarkedHosts();
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

    /** Icons of Tabs a page lists, or had dropped onto the Bookmarks. */
    tabIconsSeen: (found: FoundSiteIcon[]) => recordTabIcons(found),

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
