import browser from "webextension-polyfill";
import { isRecord } from "./localStore";
import type { FoundSiteIcon } from "./siteIconCache";

/**
 * Site Icons pages send to the background, the cache's only writer:
 * lookup results, and the icons of Tabs just made into Bookmarks.
 */
export type SiteIconMessage = {
  type: "siteIcons.lookedUp" | "siteIcons.tabsBookmarked";
  found: FoundSiteIcon[];
};

export const isSiteIconMessage = (
  message: unknown,
): message is SiteIconMessage =>
  isRecord(message) &&
  (message.type === "siteIcons.lookedUp" ||
    message.type === "siteIcons.tabsBookmarked") &&
  Array.isArray(message.found);

export const sendSiteIcons = (
  type: SiteIconMessage["type"],
  found: FoundSiteIcon[],
) => browser.runtime.sendMessage({ type, found } satisfies SiteIconMessage);
