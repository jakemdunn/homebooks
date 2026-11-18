import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

type IndexEntry = { id: string; title: string; name: string; type: string };

const index = JSON.parse(
  readFileSync(
    new URL("../dist-storybook/index.json", import.meta.url),
    "utf8",
  ),
) as { entries: Record<string, IndexEntry> };

const stories = Object.values(index.entries).filter(
  ({ type }) => type === "story",
);

/**
 * Waits until Storybook has rendered the story and run its play function,
 * then checks it didn't show its error display. Reads the preview's render
 * phase, since Storybook has no public signal for it.
 */
const waitForStoryToFinish = async (page: Page) => {
  await page.waitForFunction(() => {
    const preview = (
      window as unknown as {
        __STORYBOOK_PREVIEW__?: { storyRenders?: { phase?: string }[] };
      }
    ).__STORYBOOK_PREVIEW__;
    return preview?.storyRenders?.[0]?.phase === "finished";
  });
  await expect(
    page.locator("body"),
    "Storybook's error display",
  ).not.toHaveClass(/sb-show-errordisplay/);
};

for (const story of stories) {
  test(`${story.title} › ${story.name}`, async ({ page, baseURL }) => {
    const offOrigin: string[] = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.protocol !== "data:" && url.origin !== new URL(baseURL!).origin)
        offOrigin.push(url.href);
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto(`/iframe.html?id=${story.id}&viewMode=story`);
    await waitForStoryToFinish(page);

    await expect(page).toHaveScreenshot(`${story.id}.png`);
    expect(errors, "uncaught errors").toEqual([]);
    expect(offOrigin, "requests leaving Storybook").toEqual([]);
  });
}
