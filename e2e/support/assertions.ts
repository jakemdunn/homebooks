import { expect } from "@playwright/test";
import type { TitleTree } from "./seed";

/**
 * Long enough for a drop's bookmark or tab change to land: the drop handler
 * calls the extension APIs as soon as `drop` fires, which takes tens of ms.
 */
const SETTLE_TIME = 1_000;
const READ_INTERVAL = 100;

/**
 * Asserts `read()` keeps returning `expected` for SETTLE_TIME. Use for drops
 * that should change nothing: a single read would pass before a wrong change
 * had time to land.
 */
export const expectUnchanged = async <T>(
  read: () => Promise<T>,
  expected: T,
) => {
  const deadline = Date.now() + SETTLE_TIME;
  do {
    expect((await read()) as unknown).toEqual(expected);
    await new Promise((resolve) => setTimeout(resolve, READ_INTERVAL));
  } while (Date.now() < deadline);
};

const topLevelTitles = (tree: TitleTree) =>
  tree.map((node) => (typeof node === "string" ? node : Object.keys(node)[0]));

/**
 * Waits for the Root Folder to hold exactly `tree`, then checks the main view
 * renders its top level in that order.
 */
export const expectRootFolder = async (
  homebooks: {
    bookmarkTree: () => Promise<TitleTree>;
    renderedOrder: () => Promise<string[]>;
  },
  tree: TitleTree,
) => {
  await expect.poll(homebooks.bookmarkTree).toEqual(tree);
  await expect.poll(homebooks.renderedOrder).toEqual(topLevelTitles(tree));
};
