import type { FoundSiteIcon } from "../../util/siteIconCache";

/** Why a host is looked up: never seen, or its cached icon is stale. */
export type LookUpReason = "unknown" | "stale";

type Options = {
  /** Finds a host's Site Icon from everything available. */
  find: (pageUrl: string) => Promise<string | undefined>;
  /** Finds the browser's own Site Icon, to refresh a stale one. */
  findInBrowser: (pageUrl: string) => Promise<string | undefined>;
  /** Hands what was found to the cache's writer. */
  send: (found: FoundSiteIcon[]) => Promise<unknown>;
  /** How long finished lookups wait for slower ones before being sent. */
  sendDelay?: number;
};

/**
 * Looks up the Site Icons a page needs, each host once per page. Every
 * cache change re-renders the page, so results are sent together: once no
 * lookup is still running, or after `sendDelay` while slow ones finish.
 */
export const createSiteIconLookups = ({
  find,
  findInBrowser,
  send,
  sendDelay = 1_000,
}: Options) => {
  const started = new Set<string>();
  const finished: FoundSiteIcon[] = [];
  let running = 0;
  let sendTimer: ReturnType<typeof setTimeout> | undefined;

  const sendFinished = () => {
    clearTimeout(sendTimer);
    sendTimer = undefined;
    if (!finished.length) return;
    send(finished.splice(0)).catch((error) =>
      console.error("Couldn't store Site Icons.", error),
    );
  };

  const lookUp = (host: string, pageUrl: string, reason: LookUpReason) => {
    if (started.has(host)) return;
    started.add(host);
    running++;
    (reason === "stale" ? findInBrowser : find)(pageUrl)
      .then((icon) => finished.push(icon ? { host, icon } : { host }))
      .catch((error) => console.error("Couldn't look up a Site Icon.", error))
      .finally(() => {
        running--;
        if (running === 0) sendFinished();
        else sendTimer ??= setTimeout(sendFinished, sendDelay);
      });
  };

  return { lookUp };
};
