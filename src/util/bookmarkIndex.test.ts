import { describe, expect, it } from "vitest";
import { clampCreateIndex, toChromiumMoveIndex } from "./bookmarkIndex";

// Expected values were measured: each Firefox move below was run in
// Firefox 158, and the returned Chromium index reproduces the same final
// order in Chromium 159.
const sameParent = (from: number, index: number) =>
  toChromiumMoveIndex({
    index,
    from: { parentId: "p", index: from },
    to: { parentId: "p", childCount: 4 },
  });

describe("toChromiumMoveIndex", () => {
  it.each([
    // [title moved, from, Firefox index, Firefox result, Chromium index]
    ["A", 0, 2, "BCAD", 3],
    ["A", 0, 3, "BCDA", 4],
    ["A", 0, 4, "BCDA", 4],
    ["A", 0, 9, "BCDA", 4],
    ["D", 3, 1, "ADBC", 1],
    ["B", 1, 1, "ABCD", 1],
    ["B", 1, 2, "ACBD", 3],
  ])(
    "moving %s from %i to %i (Firefox: %s) within one parent",
    (_title, from, index, _result, chromium) => {
      expect(sameParent(from, index)).toBe(chromium);
    },
  );

  it("keeps the index when moving to another parent", () => {
    expect(
      toChromiumMoveIndex({
        index: 1,
        from: { parentId: "a", index: 0 },
        to: { parentId: "b", childCount: 3 },
      }),
    ).toBe(1);
  });

  it("appends when the index is past the end of another parent", () => {
    expect(
      toChromiumMoveIndex({
        index: 9,
        from: { parentId: "a", index: 0 },
        to: { parentId: "b", childCount: 3 },
      }),
    ).toBe(3);
  });
});

describe("clampCreateIndex", () => {
  it("appends past the end, as Firefox does", () => {
    // Firefox 158: create at index 9 in [A, B] gives [A, B, N].
    expect(clampCreateIndex(9, 2)).toBe(2);
  });

  it("keeps an in-range index", () => {
    expect(clampCreateIndex(1, 2)).toBe(1);
  });
});
