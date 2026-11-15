import type { DragPosition } from "./dragTypes";

export type DropRect = Pick<
  DOMRectReadOnly,
  "top" | "bottom" | "left" | "right" | "width" | "height"
>;

/**
 * Which Drop Position a pointer at (clientX, clientY) selects on a Drop
 * Destination with bounds `rect`.
 */
export const getDropPosition = (
  rect: DropRect,
  clientX: number,
  clientY: number,
): DragPosition => {
  const INSET = 15;
  if (
    clientY > rect.top + INSET &&
    clientY < rect.bottom - INSET &&
    clientX > rect.left + INSET &&
    clientX < rect.right - INSET
  ) {
    return "in";
  }

  const biasDepth = Math.min(rect.width, rect.height) * 0.5;
  const x = clientX - rect.left;
  const y = clientY - rect.top;

  let xBias = 0;
  if (x < biasDepth) xBias = -(1 - x / biasDepth);
  else if (x > rect.width - biasDepth)
    xBias = (x - rect.width + biasDepth) / biasDepth;

  let yBias = 0;
  if (y < biasDepth) yBias = -(1 - y / biasDepth);
  else if (y > rect.height - biasDepth)
    yBias = (y - rect.height + biasDepth) / biasDepth;

  const orientationBias = Math.abs(xBias) > Math.abs(yBias) ? "x" : "y";

  if (orientationBias === "y" && yBias < 0) return "top";
  if (orientationBias === "y" && yBias > 0) return "bottom";
  if (orientationBias === "x" && xBias < 0) return "left";
  if (orientationBias === "x" && xBias > 0) return "right";
  return rect.width > rect.height ? "bottom" : "right";
};
