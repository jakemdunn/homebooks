import { addTransitionType, startTransition } from "react";
import { DragId } from "../components/drag/dragTypes";
import { parseDragId } from "../components/drag/dragProvider.util";

/**
 * The two columns that animate independently: the Root Folder's Bookmarks
 * and Folders, and the open Windows and their tabs. Every transition names
 * the regions it changes, and each region's <ViewTransition>s animate only
 * in transitions naming it, so expanding a Folder leaves the Windows still.
 */
export type ViewTransitionRegion = "bookmarks" | "windows";

const REGION_BY_DRAG_TYPE = {
  bookmark: "bookmarks",
  folder: "bookmarks",
  tab: "windows",
  window: "windows",
} as const;

export const regionOf = (id: DragId): ViewTransitionRegion =>
  REGION_BY_DRAG_TYPE[parseDragId(id)[0]];

/**
 * The <ViewTransition> `default` class for `region`'s elements: animate in
 * transitions naming that region, and in no others.
 */
export const transitionClassFor = (region: ViewTransitionRegion) => ({
  [region]: "auto",
  default: "none",
});

/** startTransition, marked as changing `regions`. */
export const startRegionTransition = (
  regions: ViewTransitionRegion[],
  update: () => void,
) =>
  startTransition(() => {
    regions.forEach(addTransitionType);
    update();
  });
