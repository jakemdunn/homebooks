import type { BrowserContext, Locator } from "@playwright/test";
import { drag } from "./support/drag";
import { expect, test } from "./support/extension";

const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
/** A Tab's own icon, as its page declares it. */
const TAB_ICON = `data:image/png;base64,${PNG_BASE64}`;

const ALPHA = "https://alpha.test/page";
// With an empty query: see findSiteIcon.
const ALPHA_ICON = "https://alpha.test/favicon.ico?";
const BETA = "https://beta.test/page";
const GAMMA = "https://gamma.test/page";

/**
 * Sites faked for the whole context. Chrome has never seen any of them, so
 * its own _favicon gives its default globe for each.
 * - alpha.test serves a /favicon.ico.
 * - beta.test answers 404 to everything.
 * - gamma.test serves a page titled Gamma that declares TAB_ICON, and no
 *   /favicon.ico.
 */
const fakeSites = (context: BrowserContext) =>
  Promise.all([
    context.route("https://alpha.test/**", (route) =>
      new URL(route.request().url()).pathname === "/favicon.ico"
        ? route.fulfill({
            contentType: "image/png",
            body: Buffer.from(PNG_BASE64, "base64"),
          })
        : route.fulfill({ contentType: "text/html", body: "<title>A</title>" }),
    ),
    context.route("https://beta.test/**", (route) =>
      route.fulfill({ status: 404, body: "" }),
    ),
    context.route("https://gamma.test/**", (route) =>
      new URL(route.request().url()).pathname === "/page"
        ? route.fulfill({
            contentType: "text/html",
            body: `<title>Gamma</title><link rel="icon" href="${TAB_ICON}">`,
          })
        : route.fulfill({ status: 404, body: "" }),
    ),
  ]);

/** Every request URL any page in the context makes. */
const recordRequests = (context: BrowserContext) => {
  const urls: string[] = [];
  context.on("request", (request) => urls.push(request.url()));
  return urls;
};

const siteIconOf = (item: Locator) => item.locator("[data-site-icon]");

const SEED = [
  { title: "Alpha", url: ALPHA },
  { title: "Beta", url: BETA },
];

test("a Bookmark shows its site's /favicon.ico when the browser has no Site Icon", async ({
  context,
  openHomebooks,
}) => {
  await fakeSites(context);
  const homebooks = await openHomebooks(SEED);

  await expect(siteIconOf(homebooks.item("Alpha"))).toHaveAttribute(
    "src",
    ALPHA_ICON,
  );
});

test("a Bookmark with no Site Icon anywhere shows its letter tile", async ({
  context,
  openHomebooks,
}) => {
  await fakeSites(context);
  const homebooks = await openHomebooks(SEED);

  const icon = siteIconOf(homebooks.item("Beta"));
  await expect(icon).toHaveAttribute("data-site-icon", "letter");
  await expect(icon).toHaveText("B");
});

test("a Bookmark shows the icon of a Tab open on its site", async ({
  context,
  openHomebooks,
  serviceWorker,
}) => {
  await fakeSites(context);
  const homebooks = await openHomebooks([{ title: "Gamma", url: GAMMA }]);
  await expect(siteIconOf(homebooks.item("Gamma"))).toHaveAttribute(
    "data-site-icon",
    "letter",
  );

  // In a window of its own: a background tab here loads without the
  // faked site.
  await serviceWorker.evaluate(
    (url) => chrome.windows.create({ url, focused: false }),
    `${GAMMA}?opened`,
  );

  await expect(siteIconOf(homebooks.item("Gamma"))).toHaveAttribute(
    "src",
    TAB_ICON,
  );
});

test("a Tab dropped onto the Bookmarks keeps its icon", async ({
  context,
  openHomebooks,
  serviceWorker,
}) => {
  await fakeSites(context);
  const homebooks = await openHomebooks(SEED);
  const tabId = await serviceWorker.evaluate(async (url) => {
    const window = await chrome.windows.create({ url, focused: false });
    return window!.tabs![0].id!;
  }, GAMMA);
  await expect(homebooks.tab(tabId)).toContainText("Gamma");
  // Its icon has loaded once the Tab shows it.
  await expect(homebooks.tab(tabId).locator("img")).toHaveAttribute(
    "src",
    TAB_ICON,
  );

  await drag(homebooks.tab(tabId), {
    onto: homebooks.item("Beta"),
    at: "right",
  });

  // Not seeded, so found by its name rather than its id.
  const dropped = homebooks.page.getByRole("link", { name: /^Gamma/ });
  await expect(siteIconOf(dropped)).toHaveAttribute("src", TAB_ICON);
});

test("Homebooks asks no third party for anything", async ({
  context,
  openHomebooks,
}) => {
  await fakeSites(context);
  const requests = recordRequests(context);
  const homebooks = await openHomebooks(SEED);
  await expect(siteIconOf(homebooks.item("Alpha"))).toHaveAttribute(
    "src",
    ALPHA_ICON,
  );
  await expect(siteIconOf(homebooks.item("Beta"))).toHaveAttribute(
    "data-site-icon",
    "letter",
  );

  // The extension itself, the faked sites, the page's Google Fonts, and
  // React DevTools' script, which every build loads.
  const allowed =
    /^(chrome-extension:|data:|https:\/\/[a-z]+\.test\/|https:\/\/fonts\.(googleapis|gstatic)\.com\/|http:\/\/localhost:8097\/)/;
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.filter((url) => !allowed.test(url))).toEqual([]);
});

test("a new tab shows a known Site Icon on its first render", async ({
  context,
  openHomebooks,
}) => {
  await fakeSites(context);
  const homebooks = await openHomebooks(SEED);
  await expect(siteIconOf(homebooks.item("Alpha"))).toHaveAttribute(
    "src",
    ALPHA_ICON,
  );

  // Records how the page's first Site Icon (Alpha's) is first drawn.
  await context.addInitScript(() => {
    const seen: string[] = [];
    (window as unknown as { __iconSrcs: string[] }).__iconSrcs = seen;
    new MutationObserver(() => {
      if (seen.length) return;
      const icon = document.querySelector("[data-site-icon]");
      if (icon) seen.push(icon.getAttribute("src") ?? "letter tile");
    }).observe(document, { childList: true, subtree: true });
  });
  const page = await context.newPage();
  await page.goto(homebooks.page.url());
  await expect(page.getByText("Alpha", { exact: true })).toBeVisible();

  expect(
    await page.evaluate(
      () => (window as unknown as { __iconSrcs: string[] }).__iconSrcs,
    ),
  ).toEqual([ALPHA_ICON]);
});
