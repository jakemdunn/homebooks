import { describe, expect, it } from "vitest";
import type { Bookmarks, Tabs } from "webextension-polyfill";
import {
  createSiteIconRecorder,
  type SiteIconBrowser,
} from "./siteIconRecorder";
import {
  RECHECK_AFTER,
  SITE_ICONS_KEY,
  type SiteIconCache,
} from "./siteIconCache";

const NOW = 1_000;

/**
 * A browser with Bookmarks at `bookmarked` URLs (changeable through the
 * returned array), open `tabs`, and an in-memory storage.local.
 */
const fakeBrowser = ({
  bookmarked = [] as string[],
  tabs = [] as Tabs.Tab[],
  cache = {} as SiteIconCache,
  now = NOW,
}) => {
  const local: Record<string, unknown> = { [SITE_ICONS_KEY]: cache };
  const nodes = () =>
    bookmarked.map((url, i) => ({ id: `${i}`, title: "", url }));
  const browser: SiteIconBrowser = {
    bookmarks: {
      // Like the real search: a substring match on URL (and title).
      search: async ({ query }) =>
        nodes().filter(({ url }) => url.includes(query)),
      getTree: async () => [{ id: "root", title: "", children: nodes() }],
    },
    tabs: { query: async () => tabs },
    storage: {
      local: {
        get: async (key) => ({ [key]: local[key] }),
        set: async (items) => void Object.assign(local, items),
      },
    },
  };
  return {
    bookmarked,
    recorder: createSiteIconRecorder(browser, () => now),
    cache: () => local[SITE_ICONS_KEY] as SiteIconCache,
  };
};

const openTab = (url: string, favIconUrl?: string) =>
  ({ url, favIconUrl, incognito: false }) as Tabs.Tab;

const privateTab = (url: string, favIconUrl: string) =>
  ({ url, favIconUrl, incognito: true }) as Tabs.Tab;

const bookmark = (url: string) =>
  ({ id: "1", title: "", url }) as Bookmarks.BookmarkTreeNode;

describe("a Tab's icon changing", () => {
  it("is recorded when the Tab's host has a Bookmark", async () => {
    const { recorder, cache } = fakeBrowser({
      bookmarked: ["https://a.test/home"],
    });

    await recorder.tabUpdated(openTab("https://a.test/login", "data:icon-a"));

    expect(cache()).toEqual({ "a.test": { icon: "data:icon-a", seen: NOW } });
  });

  it("is skipped when the Tab's host has no Bookmark", async () => {
    const { recorder, cache } = fakeBrowser({
      // Contains "a.test" but on another host.
      bookmarked: ["https://b.test/?from=a.test"],
    });

    await recorder.tabUpdated(openTab("https://a.test/", "data:icon-a"));

    expect(cache()).toEqual({});
  });

  it("is skipped for a private-window Tab", async () => {
    const { recorder, cache } = fakeBrowser({
      bookmarked: ["https://a.test/"],
    });

    await recorder.tabUpdated(privateTab("https://a.test/", "data:icon-a"));

    expect(cache()).toEqual({});
  });
});

describe("a new Bookmark", () => {
  it("takes the icon of an open Tab on its host", async () => {
    const { recorder, cache } = fakeBrowser({
      bookmarked: ["https://a.test/page"],
      tabs: [
        openTab("https://b.test/", "data:icon-b"),
        openTab("https://a.test/other", "data:icon-a"),
      ],
    });

    await recorder.bookmarkCreated(bookmark("https://a.test/page"));

    expect(cache()).toEqual({ "a.test": { icon: "data:icon-a", seen: NOW } });
  });

  it("never takes the icon of a private-window Tab", async () => {
    const { recorder, cache } = fakeBrowser({
      bookmarked: ["https://a.test/page"],
      tabs: [privateTab("https://a.test/", "data:icon-a")],
    });

    await recorder.bookmarkCreated(bookmark("https://a.test/page"));

    expect(cache()).toEqual({});
  });
});

describe("Tabs made into Bookmarks", () => {
  it("record their icons, though the Tabs may have closed", async () => {
    const { recorder, cache } = fakeBrowser({
      bookmarked: ["https://a.test/"],
    });

    await recorder.tabsBookmarked([{ host: "a.test", icon: "data:icon-a" }]);

    expect(cache()).toEqual({ "a.test": { icon: "data:icon-a", seen: NOW } });
  });
});

describe("what a page looked up", () => {
  it("is recorded for bookmarked hosts, found or not", async () => {
    const { recorder, cache } = fakeBrowser({
      bookmarked: ["https://a.test/", "https://b.test/"],
    });

    await recorder.lookedUp([
      { host: "a.test", icon: "https://a.test/favicon.ico?" },
      { host: "b.test" },
    ]);

    expect(cache()).toEqual({
      "a.test": { icon: "https://a.test/favicon.ico?", seen: NOW },
      "b.test": { seen: NOW },
    });
  });

  it("is dropped for a host whose Bookmark has gone since", async () => {
    const { recorder, cache } = fakeBrowser({});

    await recorder.lookedUp([{ host: "a.test", icon: "data:icon-a" }]);

    expect(cache()).toEqual({});
  });

  it("never replaces a Tab's icon that isn't stale", async () => {
    const tabbed = { "a.test": { icon: "data:tab", seen: NOW } };
    const { recorder, cache } = fakeBrowser({
      bookmarked: ["https://a.test/"],
      cache: tabbed,
    });

    await recorder.lookedUp([{ host: "a.test", icon: "chrome-icon" }]);

    expect(cache()).toEqual(tabbed);
  });

  it("replaces a stale icon", async () => {
    const { recorder, cache } = fakeBrowser({
      bookmarked: ["https://a.test/"],
      cache: { "a.test": { icon: "data:tab", seen: 0 } },
      now: RECHECK_AFTER,
    });

    await recorder.lookedUp([{ host: "a.test", icon: "chrome-icon" }]);

    expect(cache()).toEqual({
      "a.test": { icon: "chrome-icon", seen: RECHECK_AFTER },
    });
  });
});

describe("a removed Bookmark", () => {
  const cached: SiteIconCache = {
    "a.test": { icon: "data:icon-a", seen: 0 },
    "b.test": { icon: "data:icon-b", seen: 0 },
  };

  it("takes with it every host no Bookmark has any more", async () => {
    const { recorder, cache } = fakeBrowser({
      bookmarked: ["https://b.test/"],
      cache: cached,
    });

    await recorder.bookmarkRemoved();

    expect(Object.keys(cache())).toEqual(["b.test"]);
  });
});

describe("a Bookmark's URL changing", () => {
  it("forgets its old host and takes its new host's icon from an open Tab", async () => {
    const { recorder, cache } = fakeBrowser({
      // a.test's only Bookmark now points at c.test.
      bookmarked: ["https://b.test/", "https://c.test/"],
      tabs: [openTab("https://c.test/", "data:icon-c")],
      cache: {
        "a.test": { icon: "data:icon-a", seen: 0 },
        "b.test": { icon: "data:icon-b", seen: 0 },
      },
    });

    await recorder.bookmarkChanged({ url: "https://c.test/" });

    expect(cache()).toEqual({
      "b.test": { icon: "data:icon-b", seen: 0 },
      "c.test": { icon: "data:icon-c", seen: NOW },
    });
  });
});

it("applies concurrent changes one after another", async () => {
  const { recorder, cache } = fakeBrowser({
    bookmarked: ["https://a.test/", "https://b.test/"],
  });

  await Promise.all([
    recorder.tabUpdated(openTab("https://a.test/", "data:icon-a")),
    recorder.tabUpdated(openTab("https://b.test/", "data:icon-b")),
  ]);

  expect(Object.keys(cache()).sort()).toEqual(["a.test", "b.test"]);
});
