import type { FoundSiteIcon } from "./siteIconCache";
import type { SiteIconMessage } from "./siteIconMessages";

type Options = {
  /** Sends to the background, the cache's writer. */
  send: (message: SiteIconMessage) => Promise<unknown>;
  /** Records on this page instead, when the background doesn't answer. */
  recordHere: (message: SiteIconMessage) => Promise<unknown>;
};

/**
 * Hands Site Icons a page found to the cache's writer: the background. If
 * it doesn't answer, the page records them itself, so icons still reach
 * the cache, and logs why, since a silent background is a bug.
 */
export const createSiteIconReporter = ({ send, recordHere }: Options) => ({
  report: async (type: SiteIconMessage["type"], found: FoundSiteIcon[]) => {
    if (!found.length) return;
    const message: SiteIconMessage = { type, found };
    try {
      await send(message);
    } catch (error) {
      console.error(
        "The background didn't take these Site Icons; recording them here.",
        error,
      );
      await recordHere(message);
    }
  },
});
