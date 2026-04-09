/**
 * True when the tab URL is an extension page or built-in browser UI.
 * Used by the toolbar popup (no bookmark form) and the tabs column: those
 * tabs are omitted from the draggable list, and windows with only such tabs
 * show an empty state.
 *
 * This replaces the older tabs filter (`!url.includes(extensionURL) &&
 * !/^about:/`), which missed e.g. `chrome:`, `edge:`, `devtools:`, and
 * treated missing URLs as visible.
 */
export function isExtensionOrBrowserInternalUrl(
  url: string | undefined,
): boolean {
  if (url == null || url === "") {
    return true;
  }
  try {
    const { protocol } = new URL(url);
    switch (protocol) {
      case "chrome-extension:":
      case "moz-extension:":
      case "extension:":
      case "about:":
      case "chrome:":
      case "edge:":
      case "brave:":
      case "opera:":
      case "resource:":
      case "devtools:":
      case "view-source:":
        return true;
      default:
        return false;
    }
  } catch {
    return true;
  }
}

/** Tabs the user can drag into HomeBooks (inverse of {@link isExtensionOrBrowserInternalUrl}). */
export function isTabUrlShownInTabsColumn(url: string | undefined): boolean {
  return !isExtensionOrBrowserInternalUrl(url);
}
