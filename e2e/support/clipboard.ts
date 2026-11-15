import type { Page } from "@playwright/test";

/**
 * Reads the real system clipboard from an extension page, which holds the
 * `clipboardRead` permission. Returns each type's text. Read-only: it never
 * changes what Homebooks put there.
 */
export const readClipboard = (page: Page) =>
  page.evaluate(async () => {
    // Chromium's read() accepts { unsanitized } (not yet in TypeScript's lib).
    const read = navigator.clipboard.read as (options?: {
      unsanitized: string[];
    }) => Promise<ClipboardItems>;
    const [item] = await read.call(navigator.clipboard, {
      unsanitized: ["text/html"],
    });
    if (!item) return {};
    const entries = await Promise.all(
      item.types.map(async (type) => [
        type,
        await (await item.getType(type)).text(),
      ]),
    );
    return Object.fromEntries(entries) as Record<string, string>;
  });

/** Puts `html` on the clipboard as another app would. */
export const writeClipboardHtml = (page: Page, html: string) =>
  page.evaluate(
    (html) =>
      navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
        }),
      ]),
    html,
  );
