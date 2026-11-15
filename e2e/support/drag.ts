import type { Locator, Page } from "@playwright/test";
import type { DragPosition } from "../../src/components/drag/dragTypes";

type Drop = {
  onto: Locator;
  at: DragPosition;
  /** How long to hover over the Drop Position before releasing, in ms. */
  hold?: number;
  /** Runs mid-drag, while hovering the Drop Position, before release. */
  beforeRelease?: () => Promise<void>;
};

type Point = { x: number; y: number };
type Box = Point & { width: number; height: number };

/** Distance from a Drop Destination's edge that lands on that edge's side. */
const EDGE_OFFSET = 3;
const DRAGOVER_INTERVAL = 50;

const center = (box: Box): Point => ({
  x: box.x + box.width / 2,
  y: box.y + box.height / 2,
});

const pointFor = (box: Box, position: DragPosition): Point => {
  const { x, y } = center(box);
  const edges: Record<DragPosition, Point> = {
    in: { x, y },
    top: { x, y: box.y + EDGE_OFFSET },
    bottom: { x, y: box.y + box.height - EDGE_OFFSET },
    left: { x: box.x + EDGE_OFFSET, y },
    right: { x: box.x + box.width - EDGE_OFFSET, y },
  };
  return edges[position];
};

/**
 * Holds the pointer at `point` for `duration` ms mid-drag. Browsers keep
 * firing dragover while a dragging pointer rests (HTML spec: every ~350ms),
 * but Chromium under Playwright only fires it on pointer movement, so a
 * 1px back-and-forth stands in for that repeat.
 */
const restAt = async (page: Page, point: Point, duration: number) => {
  const deadline = Date.now() + duration;
  let offset = 1;
  do {
    await page.waitForTimeout(DRAGOVER_INTERVAL);
    await page.mouse.move(point.x + offset, point.y);
    offset = -offset;
  } while (Date.now() < deadline);
  await page.mouse.move(point.x, point.y);
};

const boxOf = async (locator: Locator, role: string) => {
  // Wait until it's visible, stable and hit-testable, as a user would.
  await locator.hover({ trial: true });
  const box = await locator.boundingBox();
  if (!box) throw new Error(`${role} must be visible`);
  return box;
};

/** Presses on `source` and moves just far enough to start a native drag. */
const startDrag = async (source: Locator) => {
  const page = source.page();
  const start = center(await boxOf(source, "Drag Source"));
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 10, start.y + 10, { steps: 2 });
};

/**
 * Mid-drag, moves to `at` on `onto` and rests there for `hold` ms. Measures
 * `onto` only now, because the Drag Source restyles once dragging, which
 * can shift the layout.
 */
export const hoverDuringDrag = async ({
  onto,
  at,
  hold = 100,
}: Omit<Drop, "beforeRelease">) => {
  const page = onto.page();
  const point = pointFor(await boxOf(onto, "Drop Destination"), at);
  await page.mouse.move(point.x, point.y, { steps: 10 });
  await restAt(page, point, hold);
};

/**
 * Drags `source` to the Drop Position `at` on `onto` with real pointer input,
 * so Chromium runs its own native drag session. Moves are stepped so
 * dragenter, dragover and dragleave fire as they do for a user. Never
 * constructs DragEvent or DataTransfer (ADR-0001).
 */
export const drag = async (
  source: Locator,
  { beforeRelease, ...drop }: Drop,
) => {
  await startDrag(source);
  await hoverDuringDrag(drop);
  await beforeRelease?.();
  await source.page().mouse.up();
};
