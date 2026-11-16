import { isRecord } from "./localStore";
import type { FoundSiteIcon } from "./siteIconCache";
import type { createSiteIconRecorder } from "./siteIconRecorder";

/**
 * Site Icons a page hands to the cache's writer: what it looked up, and
 * the icons of Tabs it lists or had dropped onto the Bookmarks.
 */
export type SiteIconMessage = {
  type: "siteIcons.lookedUp" | "siteIcons.tabsSeen";
  found: FoundSiteIcon[];
};

export const isSiteIconMessage = (
  message: unknown,
): message is SiteIconMessage =>
  isRecord(message) &&
  (message.type === "siteIcons.lookedUp" ||
    message.type === "siteIcons.tabsSeen") &&
  Array.isArray(message.found);

/** Records a message's Site Icons through `recorder`. */
export const recordSiteIconMessage = (
  recorder: ReturnType<typeof createSiteIconRecorder>,
  { type, found }: SiteIconMessage,
) =>
  type === "siteIcons.lookedUp"
    ? recorder.lookedUp(found)
    : recorder.tabIconsSeen(found);
