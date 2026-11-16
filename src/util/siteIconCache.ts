import { isRecord } from "./localStore";

/**
 * Site Icons for bookmarked hosts, kept in `storage.local`. An entry with
 * no `icon` records that none could be found. `seen` is when the entry was
 * last recorded or checked: entries are checked again once RECHECK_AFTER
 * has passed, and the least recently seen are evicted first.
 */
export type SiteIconEntry = { icon?: string; seen: number };
export type SiteIconCache = Record<string, SiteIconEntry>;

/** The `storage.local` key the cache is kept under. */
export const SITE_ICONS_KEY = "siteIcons";

/** The most hosts the cache keeps. */
export const SITE_ICON_LIMIT = 2_000;

/** How long an entry is trusted before it's checked again. */
export const RECHECK_AFTER = 7 * 24 * 60 * 60 * 1_000;

/**
 * What the cache knows about a host. A `stale` icon is still shown, but
 * the browser is asked again whether it has a newer one.
 */
export type SiteIconLookup =
  | { kind: "icon"; icon: string; stale: boolean }
  | { kind: "missing" }
  | { kind: "unknown" };

/** A Site Icon found for a host; no `icon` when none could be found. */
export type FoundSiteIcon = { host: string; icon?: string };

/** The host of `url`, or undefined when it has none (data:, about:, …). */
export const hostOf = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  try {
    return new URL(url).host || undefined;
  } catch {
    return undefined;
  }
};

/** Drops the least recently seen hosts beyond SITE_ICON_LIMIT. */
const withinLimit = (cache: SiteIconCache): SiteIconCache => {
  const hosts = Object.keys(cache);
  if (hosts.length <= SITE_ICON_LIMIT) return cache;
  const kept = hosts
    .sort((a, b) => cache[b].seen - cache[a].seen)
    .slice(0, SITE_ICON_LIMIT);
  return Object.fromEntries(kept.map((host) => [host, cache[host]]));
};

/** A Tab's host and icon, if it may be recorded: never a private one. */
export const tabSiteIcon = (tab: {
  url?: string;
  favIconUrl?: string;
  incognito: boolean;
}): FoundSiteIcon | undefined => {
  const host = hostOf(tab.url);
  return !tab.incognito && host && tab.favIconUrl
    ? { host, icon: tab.favIconUrl }
    : undefined;
};

const isStale = (entry: SiteIconEntry, now: number) =>
  now - entry.seen >= RECHECK_AFTER;

/** Records the icon a Tab shows for `host`, replacing any other. */
export const recordSiteIcon = (
  cache: SiteIconCache,
  host: string,
  icon: string,
  now: number,
): SiteIconCache => withinLimit({ ...cache, [host]: { icon, seen: now } });

/**
 * Records what looking a host up found. A Tab's icon is trusted over a
 * lookup until it goes stale, and a stale icon is kept when the lookup
 * finds nothing better.
 */
export const recordLookedUpSiteIcon = (
  cache: SiteIconCache,
  { host, icon }: FoundSiteIcon,
  now: number,
): SiteIconCache => {
  const known = cache[host];
  if (known?.icon && !isStale(known, now)) return cache;
  const found = icon ?? known?.icon;
  return withinLimit({
    ...cache,
    [host]: found ? { icon: found, seen: now } : { seen: now },
  });
};

export const forgetSiteIcons = (
  cache: SiteIconCache,
  hosts: string[],
): SiteIconCache =>
  Object.fromEntries(
    Object.entries(cache).filter(([host]) => !hosts.includes(host)),
  );

export const lookUpSiteIcon = (
  cache: SiteIconCache,
  host: string,
  now: number,
): SiteIconLookup => {
  const entry = cache[host];
  if (!entry) return { kind: "unknown" };
  if (entry.icon)
    return { kind: "icon", icon: entry.icon, stale: isStale(entry, now) };
  return isStale(entry, now) ? { kind: "unknown" } : { kind: "missing" };
};
const isEntry = (value: unknown): value is SiteIconEntry =>
  isRecord(value) &&
  typeof value.seen === "number" &&
  (value.icon === undefined || typeof value.icon === "string");

/** The cache saved in storage, dropping anything malformed. */
export const parseSiteIconCache = (saved: unknown): SiteIconCache =>
  isRecord(saved)
    ? Object.fromEntries(
        Object.entries(saved).filter(
          (entry): entry is [string, SiteIconEntry] => isEntry(entry[1]),
        ),
      )
    : {};
