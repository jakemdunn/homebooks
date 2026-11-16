import { describe, expect, it } from "vitest";
import { type DragState, dragReducer, initialDragState } from "./dragReducer";

const midDrag = (overrides: Partial<DragState> = {}): DragState => ({
  sourceIds: new Set(["bookmark-1"]),
  peekedIds: new Set(),
  ...overrides,
});

const LEFT_MARKER = { width: 0, height: 20, top: 5, left: 8 };

describe("dragReducer", () => {
  it("starts a drag with the Drag Source", () => {
    const state = dragReducer(initialDragState, {
      action: "startDrag",
      id: "bookmark-1",
    });
    expect([...state.sourceIds]).toEqual(["bookmark-1"]);
  });

  it("ends a drag by clearing sources, Peeks and the Drop Destination", () => {
    const state = dragReducer(
      midDrag({
        peekedIds: new Set(["folder-2"]),
        destinationId: "folder-2",
        position: "in",
        indicator: LEFT_MARKER,
      }),
      { action: "endDrag" },
    );
    expect(state.sourceIds.size).toBe(0);
    expect(state.peekedIds.size).toBe(0);
    expect(state.destinationId).toBeUndefined();
    expect(state.position).toBeUndefined();
    expect(state.indicator).toBeUndefined();
  });

  it("keeps the same state when ending a drag that has already ended", () => {
    const ended = dragReducer(midDrag(), { action: "endDrag" });
    expect(dragReducer(ended, { action: "endDrag" })).toBe(ended);
  });

  it("sets the Drop Destination, Drop Position and drop marker", () => {
    const state = dragReducer(midDrag(), {
      action: "setDestination",
      id: "bookmark-2",
      position: "left",
      indicator: LEFT_MARKER,
    });
    expect(state).toMatchObject({
      destinationId: "bookmark-2",
      position: "left",
      indicator: LEFT_MARKER,
    });
  });

  it("keeps the same state when the Drop Destination and Drop Position are unchanged", () => {
    const before = midDrag({ destinationId: "bookmark-2", position: "left" });
    const after = dragReducer(before, {
      action: "setDestination",
      id: "bookmark-2",
      position: "left",
      indicator: { ...LEFT_MARKER },
    });
    expect(after).toBe(before);
  });

  it("updates the Drop Position over the same Drop Destination", () => {
    const state = dragReducer(
      midDrag({ destinationId: "bookmark-2", position: "left" }),
      {
        action: "setDestination",
        id: "bookmark-2",
        position: "right",
        indicator: LEFT_MARKER,
      },
    );
    expect(state.position).toBe("right");
  });

  it("clears the Drop Destination and its drop marker", () => {
    const state = dragReducer(
      midDrag({
        destinationId: "bookmark-2",
        position: "left",
        indicator: LEFT_MARKER,
      }),
      { action: "removeDestination" },
    );
    expect(state.destinationId).toBeUndefined();
    expect(state.position).toBeUndefined();
    expect(state.indicator).toBeUndefined();
  });

  it("keeps the same state when clearing an absent Drop Destination", () => {
    const before = midDrag();
    expect(dragReducer(before, { action: "removeDestination" })).toBe(before);
  });

  it("records a Peek once", () => {
    const peeked = dragReducer(midDrag(), {
      action: "addPeek",
      id: "folder-2",
    });
    expect([...peeked.peekedIds]).toEqual(["folder-2"]);
    expect(dragReducer(peeked, { action: "addPeek", id: "folder-2" })).toBe(
      peeked,
    );
  });
});
