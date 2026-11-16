import { FC, useEffect, useMemo, useState } from "react";
import { useStorage, useStorageAnswered } from "../../util/useStorage";
import {
  hostOf,
  lookUpSiteIcon,
  parseSiteIconCache,
  SITE_ICONS_KEY,
} from "../../util/siteIconCache";
import { sendSiteIcons } from "../../util/siteIconMessages";
import { findBrowserSiteIcon, findSiteIcon } from "./findSiteIcon";
import { createSiteIconLookups } from "./siteIconLookups";
import {
  ICON_SIZE,
  iconStyle,
  letterTileBackgroundStyle,
  letterTileLetterStyle,
} from "./siteIcon.css";

/** When this page loaded: entries that go stale later are checked later. */
const PAGE_LOADED = Date.now();

const lookups = createSiteIconLookups({
  find: findSiteIcon,
  findInBrowser: findBrowserSiteIcon,
  send: (found) => sendSiteIcons("siteIcons.lookedUp", found),
});

/** An icon image at the size every Item draws its icon. */
export const IconImage: FC<
  Omit<React.ImgHTMLAttributes<HTMLImageElement>, "width" | "height">
> = (props) => (
  <img
    className={iconStyle}
    width={ICON_SIZE}
    height={ICON_SIZE}
    alt=""
    {...props}
  />
);

/** The host's first letter, skipping "www.". */
const letterOf = (host: string | undefined) =>
  (host?.replace(/^www\./, "")[0] ?? "?").toUpperCase();

const LetterTile: FC<{ host?: string }> = ({ host }) => (
  <svg
    className={iconStyle}
    data-site-icon="letter"
    width={ICON_SIZE}
    height={ICON_SIZE}
    viewBox={`0 0 ${ICON_SIZE} ${ICON_SIZE}`}
    aria-hidden
  >
    <rect
      className={letterTileBackgroundStyle}
      width={ICON_SIZE}
      height={ICON_SIZE}
      rx={6}
    />
    <text
      className={letterTileLetterStyle}
      x="50%"
      y="50%"
      dominantBaseline="central"
      textAnchor="middle"
      fontSize={18}
    >
      {letterOf(host)}
    </text>
  </svg>
);

/**
 * The Site Icon of a Bookmark's site: the cached one, else a letter tile
 * while (or after) the browser and the site are asked for one. A stale
 * cached icon stays shown while the browser is asked for a newer one.
 */
export const SiteIcon: FC<{ url: string }> = ({ url }) => {
  const host = hostOf(url);
  const [saved] = useStorage<unknown>(SITE_ICONS_KEY, undefined, "local");
  const answered = useStorageAnswered(SITE_ICONS_KEY, "local");
  const cache = useMemo(() => parseSiteIconCache(saved), [saved]);
  const lookup = host
    ? lookUpSiteIcon(cache, host, PAGE_LOADED)
    : ({ kind: "missing" } as const);
  const reason =
    lookup.kind === "unknown"
      ? "unknown"
      : lookup.kind === "icon" && lookup.stale
        ? "stale"
        : undefined;
  // A cached icon that no longer loads shows the letter tile instead.
  const [broken, setBroken] = useState<string>();

  useEffect(() => {
    // Only once storage has answered, so its cache is the one checked.
    if (host && answered && reason) lookups.lookUp(host, url, reason);
  }, [host, url, answered, reason]);

  return lookup.kind === "icon" && lookup.icon !== broken ? (
    <IconImage
      data-site-icon="image"
      src={lookup.icon}
      onError={() => setBroken(lookup.icon)}
    />
  ) : (
    <LetterTile host={host} />
  );
};
