import { describe, expect, it } from "vitest";
import { getDropPosition, type DropRect } from "./dropPosition";

const rect = (
  left: number,
  top: number,
  width: number,
  height: number,
): DropRect => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
});

// A typical Bookmark tile: 100×56 at (200, 100). Its edge bias zone is
// min(100, 56) / 2 = 28px deep, and the "in" region is inset 15px.
const tile = rect(200, 100, 100, 56);

describe("getDropPosition", () => {
  it("is 'in' more than 15px inside every edge", () => {
    expect(getDropPosition(tile, 250, 128)).toBe("in");
    expect(getDropPosition(tile, 216, 116)).toBe("in");
  });

  it.each([
    ["left", 203, 128],
    ["right", 297, 128],
    ["top", 250, 103],
    ["bottom", 250, 153],
  ] as const)("is '%s' just inside that edge", (position, x, y) => {
    expect(getDropPosition(tile, x, y)).toBe(position);
  });

  it("treats exactly 15px from an edge as outside the 'in' region", () => {
    expect(getDropPosition(tile, 215, 128)).toBe("left");
  });

  it("picks the edge the pointer is deeper into at a corner", () => {
    // 3px from the left, 10px from the top: deeper into the left zone.
    expect(getDropPosition(tile, 203, 110)).toBe("left");
    // 10px from the left, 3px from the top: deeper into the top zone.
    expect(getDropPosition(tile, 210, 103)).toBe("top");
  });

  it("prefers top or bottom when a corner is equally deep on both axes", () => {
    expect(getDropPosition(tile, 203, 103)).toBe("top");
    expect(getDropPosition(tile, 297, 153)).toBe("bottom");
  });

  it("falls back to 'bottom' on a wide Drop Destination when outside the 'in' region but in no edge zone", () => {
    // 200×20: bias zones are 10px deep, so y = 10 is in neither, yet it is
    // within 15px of the top, so not 'in'.
    expect(getDropPosition(rect(0, 0, 200, 20), 100, 10)).toBe("bottom");
  });

  it("falls back to 'right' on a tall Drop Destination in the same situation", () => {
    expect(getDropPosition(rect(0, 0, 20, 200), 10, 100)).toBe("right");
  });
});
