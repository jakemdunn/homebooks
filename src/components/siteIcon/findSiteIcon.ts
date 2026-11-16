import browser from "webextension-polyfill";
import { ICON_SIZE } from "./siteIcon.css";

/** Ask for twice the drawn size, for high-DPI screens. */
const REQUESTED_SIZE = ICON_SIZE * 2;

/** A page no browser has an icon for, to learn its default icon. */
const UNSEEN_PAGE = "https://homebooks.invalid/";

/** Whether this build may use the browser's own Site Icons (Chrome only). */
const hasBrowserSiteIcons = () =>
  browser.runtime.getManifest().permissions?.includes("favicon") ?? false;

/** Chrome's own Site Icon for a page it has seen; its default otherwise. */
const browserSiteIconUrl = (pageUrl: string) => {
  const url = new URL(browser.runtime.getURL("/_favicon/"));
  url.searchParams.set("pageUrl", pageUrl);
  url.searchParams.set("size", String(REQUESTED_SIZE));
  return url.href;
};

/** A response's body, as a string to compare with another. */
const contentOf = async (url: string) =>
  new Uint8Array(await (await fetch(url)).arrayBuffer()).join();

let defaultIcon: Promise<string> | undefined;

/**
 * The browser's own Site Icon for `pageUrl`. Undefined when the browser
 * has none to give, or gives only its default for pages it hasn't seen.
 */
export const findBrowserSiteIcon = async (pageUrl: string) => {
  if (!hasBrowserSiteIcons()) return undefined;
  defaultIcon ??= contentOf(browserSiteIconUrl(UNSEEN_PAGE));
  const icon = browserSiteIconUrl(pageUrl);
  return (await contentOf(icon)) === (await defaultIcon) ? undefined : icon;
};

const loads = (src: string) =>
  new Promise<boolean>((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image.naturalWidth > 0);
    image.onerror = () => resolve(false);
    image.src = src;
  });

/**
 * A Site Icon for `pageUrl` from the browser, or else the one the site
 * serves at its root. Undefined when neither has one. Never asks a third
 * party.
 */
export const findSiteIcon = async (
  pageUrl: string,
): Promise<string | undefined> => {
  const fromBrowser = await findBrowserSiteIcon(pageUrl);
  if (fromBrowser) return fromBrowser;
  // Chrome drops an extension page's requests for exactly /favicon.ico
  // without sending them (seen in Chrome for Testing); an empty query
  // gets through, and sites serve the same file.
  const rootIcon = new URL("/favicon.ico?", pageUrl).href;
  return (await loads(rootIcon)) ? rootIcon : undefined;
};
