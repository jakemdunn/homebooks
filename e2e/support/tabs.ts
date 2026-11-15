import type { Worker } from "@playwright/test";

/** A page whose title is `title`, needing no network. */
export const tabUrl = (title: string) =>
  `data:text/html,<title>${encodeURIComponent(title)}</title>`;

/**
 * Opens a tab per URL through the real tabs API, in a new window or in the
 * window Homebooks is open in. Returns tab ids in `urls` order.
 */
export const createTabs = (
  serviceWorker: Worker,
  { urls, inHomebooksWindow }: { urls: string[]; inHomebooksWindow: boolean },
) =>
  serviceWorker.evaluate(
    async ({ urls, inHomebooksWindow }) => {
      if (!inHomebooksWindow) {
        const created = await chrome.windows.create({
          url: urls,
          focused: false,
        });
        return {
          windowId: created!.id!,
          tabIds: (created!.tabs ?? []).map((tab) => tab.id!),
        };
      }
      const [homebooks] = await chrome.tabs.query({
        url: chrome.runtime.getURL("src/homepage.html"),
      });
      const windowId = homebooks.windowId;
      const tabIds: number[] = [];
      for (const url of urls)
        tabIds.push(
          (await chrome.tabs.create({ windowId, url, active: false })).id!,
        );
      return { windowId, tabIds };
    },
    { urls, inHomebooksWindow },
  );

/** Ids of every open tab, read through the real tabs API. */
export const readOpenTabIds = (serviceWorker: Worker) =>
  serviceWorker.evaluate(async () =>
    (await chrome.tabs.query({})).map((tab) => tab.id!),
  );

/**
 * Each open window's tab URLs, in tab order, keyed by window id. A tab still
 * loading reports the URL it's loading.
 */
export const readOpenTabUrls = (serviceWorker: Worker) =>
  serviceWorker.evaluate(async () => {
    const windows = await chrome.windows.getAll({ populate: true });
    return Object.fromEntries(
      windows.map((window) => [
        window.id!,
        (window.tabs ?? []).map((tab) => tab.pendingUrl || tab.url || ""),
      ]),
    );
  });

/** Ids of every open window. */
export const readWindowIds = async (serviceWorker: Worker) =>
  Object.keys(await readOpenTabUrls(serviceWorker));

/** Tab URLs of each window opened since `windowIdsBefore` was read. */
export const readNewWindowsTabUrls = async (
  serviceWorker: Worker,
  windowIdsBefore: string[],
) =>
  Object.entries(await readOpenTabUrls(serviceWorker))
    .filter(([id]) => !windowIdsBefore.includes(id))
    .map(([, urls]) => urls);
