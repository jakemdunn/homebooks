import type { CSSProperties } from "react";
import type { DragPosition } from "./dragTypes";

/** How far the marker sits outside the Drop Destination's edge. */
const EDGE_OFFSET = 2;
/** How far a side marker is inset from the tile's top. */
const SIDE_INSET = 5;
/** How much shorter a side marker is than its tile. */
const SIDE_SHORTEN = 15;
/** How far a row marker is inset from its grid's left. */
const ROW_INSET = 5;
/** How much narrower a row marker is than its grid. */
const ROW_SHORTEN = 15;

/**
 * Where to draw the drop marker for `position` on `target`: a vertical bar
 * beside it, a horizontal bar across its grid, or an outline inside it.
 */
export const dropIndicatorBounds = (
  target: Element,
  position: DragPosition,
): CSSProperties => {
  const container = target.closest("[data-grid-container]");
  if (!container) return {};
  const tile = target.getBoundingClientRect();
  const grid = container.getBoundingClientRect();
  switch (position) {
    case "left":
    case "right":
      return {
        width: 0,
        height: tile.height - SIDE_SHORTEN,
        top: tile.top + SIDE_INSET,
        left: tile[position] - EDGE_OFFSET,
      };
    case "top":
    case "bottom":
      return {
        width: grid.width - ROW_SHORTEN,
        height: 0,
        top: tile[position] - EDGE_OFFSET,
        left: grid.left + ROW_INSET,
      };
    case "in":
      return {
        width: `calc(${tile.width}px - 0.5rem)`,
        height: `calc(${tile.height}px - 0.5rem)`,
        top: `calc(${tile.top}px + 0.25rem)`,
        left: `calc(${tile.left}px + 0.25rem)`,
      };
  }
};
