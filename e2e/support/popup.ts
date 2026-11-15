import type { BrowserContext, Page, Worker } from "@playwright/test";

type Fixtures = { context: BrowserContext; serviceWorker: Worker };

/**
 * Opens the browser action popup's page while `activeUrl` is the active tab.
 *
 * The popup reads "the active tab in the current window". Opening
 * popup.html as a background tab in a window whose active tab is
 * `activeUrl` makes that query see `activeUrl`, as the real popup would.
 * Chromium's chrome.action.openPopup() isn't needed: this works headless.
 */
export const openPopup = async (
  { context, serviceWorker }: Fixtures,
  activeUrl: string,
): Promise<Page> => {
  const popupUrl = new URL("/src/popup.html", serviceWorker.url()).href;
  const opened = context.waitForEvent("page", (page) =>
    page.url().startsWith(popupUrl),
  );
  const windowId = await openLoadedWindow(serviceWorker, activeUrl);
  await openBackgroundTab(serviceWorker, { windowId, url: popupUrl });
  const page = await opened;
  await page.waitForLoadState();
  return page;
};

/**
 * Opens a window showing `url` and waits for it to load: the popup reads the
 * tab's title and URL once.
 */
const openLoadedWindow = (serviceWorker: Worker, url: string) =>
  serviceWorker.evaluate(async (url) => {
    const window = await chrome.windows.create({ url, focused: false });
    const [tab] = window!.tabs!;
    while ((await chrome.tabs.get(tab.id!)).status !== "complete")
      await new Promise((resolve) => setTimeout(resolve, 50));
    return window!.id!;
  }, url);

const openBackgroundTab = (
  serviceWorker: Worker,
  tab: { windowId: number; url: string },
) =>
  serviceWorker.evaluate(
    ({ windowId, url }) => chrome.tabs.create({ windowId, url, active: false }),
    tab,
  );
