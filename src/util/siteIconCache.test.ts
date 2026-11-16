import { describe, expect, it } from "vitest";
import {
  forgetSiteIcons,
  hostOf,
  lookUpSiteIcon,
  parseSiteIconCache,
  RECHECK_AFTER,
  recordLookedUpSiteIcon,
  recordSiteIcon,
  SITE_ICON_LIMIT,
  tabSiteIcon,
  type SiteIconCache,
} from "./siteIconCache";

const ICON = "https://a.test/favicon.ico?";
const TAB_ICON = "data:tab-icon";
const STALE = RECHECK_AFTER;

describe("hostOf", () => {
  it("is the host, port included, of a web URL", () => {
    expect(hostOf("https://dev.cqmap.org/login?x=1")).toBe("dev.cqmap.org");
    expect(hostOf("http://localhost:8080/")).toBe("localhost:8080");
  });

  it("is undefined for URLs with no host, and for non-URLs", () => {
    expect(hostOf("data:text/html,hi")).toBeUndefined();
    expect(hostOf("about:blank")).toBeUndefined();
    expect(hostOf("not a url")).toBeUndefined();
    expect(hostOf(undefined)).toBeUndefined();
  });
});

describe("a Tab's Site Icon", () => {
  const tab = { url: "https://a.test/login", favIconUrl: TAB_ICON };

  it("is its icon, for its host", () => {
    expect(tabSiteIcon({ ...tab, incognito: false })).toEqual({
      host: "a.test",
      icon: TAB_ICON,
    });
  });

  it("is never taken from a private-window Tab", () => {
    expect(tabSiteIcon({ ...tab, incognito: true })).toBeUndefined();
  });

  it("is nothing when the Tab has no icon or no host", () => {
    expect(tabSiteIcon({ url: tab.url, incognito: false })).toBeUndefined();
    expect(
      tabSiteIcon({
        url: "data:text/html,a",
        favIconUrl: TAB_ICON,
        incognito: false,
      }),
    ).toBeUndefined();
  });
});

describe("looking a host up in the cache", () => {
  it("finds a recorded icon", () => {
    const cache = recordSiteIcon({}, "a.test", ICON, 0);

    expect(lookUpSiteIcon(cache, "a.test", 0)).toEqual({
      kind: "icon",
      icon: ICON,
      stale: false,
    });
  });

  it("knows nothing about a host never recorded", () => {
    expect(lookUpSiteIcon({}, "a.test", 0)).toEqual({ kind: "unknown" });
  });

  it("marks an icon stale once RECHECK_AFTER has passed", () => {
    const cache = recordSiteIcon({}, "a.test", ICON, 0);

    expect(lookUpSiteIcon(cache, "a.test", STALE)).toEqual({
      kind: "icon",
      icon: ICON,
      stale: true,
    });
  });

  it("trusts a missing icon until RECHECK_AFTER, then knows nothing", () => {
    const cache = recordLookedUpSiteIcon({}, { host: "a.test" }, 1_000);

    expect(lookUpSiteIcon(cache, "a.test", 1_000 + STALE - 1)).toEqual({
      kind: "missing",
    });
    expect(lookUpSiteIcon(cache, "a.test", 1_000 + STALE)).toEqual({
      kind: "unknown",
    });
  });
});

describe("recording a Tab's icon", () => {
  it("replaces whatever the host had", () => {
    const cache = recordSiteIcon(
      recordSiteIcon({}, "a.test", ICON, 0),
      "a.test",
      TAB_ICON,
      1,
    );

    expect(cache["a.test"]).toEqual({ icon: TAB_ICON, seen: 1 });
  });
});

describe("recording a lookup", () => {
  it("records the icon found for an unknown host", () => {
    const cache = recordLookedUpSiteIcon({}, { host: "a.test", icon: ICON }, 1);

    expect(cache["a.test"]).toEqual({ icon: ICON, seen: 1 });
  });

  it("records that nothing was found", () => {
    const cache = recordLookedUpSiteIcon({}, { host: "a.test" }, 1);

    expect(cache["a.test"]).toEqual({ seen: 1 });
  });

  it("never replaces an icon that isn't stale: a Tab's icon wins", () => {
    const tabbed = recordSiteIcon({}, "a.test", TAB_ICON, 0);

    expect(
      recordLookedUpSiteIcon(tabbed, { host: "a.test", icon: ICON }, 1),
    ).toBe(tabbed);
    expect(recordLookedUpSiteIcon(tabbed, { host: "a.test" }, 1)).toBe(tabbed);
  });

  it("replaces a stale icon with the one found", () => {
    const cache = recordLookedUpSiteIcon(
      recordSiteIcon({}, "a.test", TAB_ICON, 0),
      { host: "a.test", icon: ICON },
      STALE,
    );

    expect(cache["a.test"]).toEqual({ icon: ICON, seen: STALE });
  });

  it("keeps a stale icon, checked again later, when nothing is found", () => {
    const cache = recordLookedUpSiteIcon(
      recordSiteIcon({}, "a.test", TAB_ICON, 0),
      { host: "a.test" },
      STALE,
    );

    expect(cache["a.test"]).toEqual({ icon: TAB_ICON, seen: STALE });
  });
});

it("forgets hosts", () => {
  const cache = forgetSiteIcons(
    recordSiteIcon(recordSiteIcon({}, "a.test", ICON, 0), "b.test", ICON, 0),
    ["a.test", "c.test"],
  );

  expect(Object.keys(cache)).toEqual(["b.test"]);
});

it(`keeps at most ${SITE_ICON_LIMIT} hosts, dropping the least recently seen`, () => {
  let cache: SiteIconCache = {};
  for (let i = 0; i < SITE_ICON_LIMIT; i++)
    cache = recordSiteIcon(cache, `host-${i}.test`, ICON, i);
  // Seen again, so it outlives hosts recorded after it.
  cache = recordSiteIcon(cache, "host-0.test", ICON, SITE_ICON_LIMIT);

  cache = recordSiteIcon(cache, "new.test", ICON, SITE_ICON_LIMIT + 1);

  expect(Object.keys(cache)).toHaveLength(SITE_ICON_LIMIT);
  expect(cache["host-0.test"]).toBeDefined();
  expect(cache["host-1.test"]).toBeUndefined();
  expect(cache["new.test"]).toBeDefined();
});

describe("reading the cache back from storage", () => {
  it("keeps only well-formed entries", () => {
    expect(
      parseSiteIconCache({
        "a.test": { icon: ICON, seen: 1 },
        "b.test": { seen: 2 },
        "c.test": { icon: 3, seen: 1 },
        "d.test": "nope",
      }),
    ).toEqual({ "a.test": { icon: ICON, seen: 1 }, "b.test": { seen: 2 } });
  });

  it("is empty when what's stored isn't a cache", () => {
    expect(parseSiteIconCache(undefined)).toEqual({});
    expect(parseSiteIconCache([1])).toEqual({});
  });
});
