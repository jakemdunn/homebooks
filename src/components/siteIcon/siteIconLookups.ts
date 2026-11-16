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
 * Looks up the Site Icons a page needs, each host once per page, and keeps
 * what it finds so the page can show it straight away. Every
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
  /** Icons found on this page, by host. */
  const icons = new Map<string, string>();
  const listeners = new Set<() => void>();
  const finished: FoundSiteIcon[] = [];
  let running = 0;
  let sendTimer: ReturnType<typeof setTimeout> | undefined;

  const sendFinished = () => {
    clearTimeout(sendTimer);
    sendTimer = undefined;
    if (!finished.length) return;
    const batch = finished.splice(0);
    // Shown and stored together: each re-renders the page.
    for (const { host, icon } of batch) if (icon) icons.set(host, icon);
    if (batch.some(({ icon }) => icon))
      listeners.forEach((listener) => listener());
    send(batch).catch((error) =>
      console.error("Couldn't store Site Icons.", error),
    );
  };

  const lookUp = (host: string, pageUrl: string, reason: LookUpReason) => {
    if (started.has(host)) return;
    started.add(host);
    running++;
    (reason === "stale" ? findInBrowser : find)(pageUrl)
      .then((icon) => void finished.push(icon ? { host, icon } : { host }))
      .catch((error) => console.error("Couldn't look up a Site Icon.", error))
      .finally(() => {
        running--;
        if (running === 0) sendFinished();
        else sendTimer ??= setTimeout(sendFinished, sendDelay);
      });
  };

  return {
    lookUp,
    /** The icon this page found for `host`, before the cache has it. */
    foundIcon: (host: string) => icons.get(host),
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
};
