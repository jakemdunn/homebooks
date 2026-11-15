import { describe, expect, it } from "vitest";
import type { DragState } from "./dragContext";
import { dragReducer, initialDragState } from "./dragReducer";

const dragging = (overrides: Partial<DragState> = {}): DragState => ({
  dragging: true,
  sourceIds: new Set(["bookmark-1"]),
  peekedIds: new Set(),
  ...overrides,
});

describe("dragReducer", () => {
  it("starts a drag with the Drag Source", () => {
    const state = dragReducer(initialDragState, {
      action: "startDrag",
      id: "bookmark-1",
    });
    expect(state.dragging).toBe(true);
    expect([...state.sourceIds]).toEqual(["bookmark-1"]);
  });

  it("ends a drag by clearing sources, Peeks and the Drop Destination", () => {
    const state = dragReducer(
      dragging({
        peekedIds: new Set(["folder-2"]),
        destinationId: "folder-2",
        position: "in",
      }),
      { action: "endDrag" },
    );
    expect(state).toMatchObject({
      dragging: false,
      destinationId: undefined,
      position: undefined,
    });
    expect(state.sourceIds.size).toBe(0);
    expect(state.peekedIds.size).toBe(0);
  });

  it("sets the Drop Destination and Drop Position", () => {
    const state = dragReducer(dragging(), {
      action: "setDestination",
      id: "bookmark-2",
      position: "left",
    });
    expect(state).toMatchObject({
      destinationId: "bookmark-2",
      position: "left",
    });
  });

  it("keeps the same state when the Drop Destination and Drop Position are unchanged", () => {
    const before = dragging({ destinationId: "bookmark-2", position: "left" });
    const after = dragReducer(before, {
      action: "setDestination",
      id: "bookmark-2",
      position: "left",
    });
    expect(after).toBe(before);
  });

  it("updates the Drop Position over the same Drop Destination", () => {
    const state = dragReducer(
      dragging({ destinationId: "bookmark-2", position: "left" }),
      { action: "setDestination", id: "bookmark-2", position: "right" },
    );
    expect(state.position).toBe("right");
  });

  it("clears the Drop Destination", () => {
    const state = dragReducer(
      dragging({ destinationId: "bookmark-2", position: "left" }),
      { action: "removeDestination" },
    );
    expect(state.destinationId).toBeUndefined();
    expect(state.position).toBeUndefined();
  });

  it("keeps the same state when clearing an absent Drop Destination", () => {
    const before = dragging();
    expect(dragReducer(before, { action: "removeDestination" })).toBe(before);
  });

  it("records a Peek once", () => {
    const peeked = dragReducer(dragging(), {
      action: "addPeek",
      id: "folder-2",
    });
    expect([...peeked.peekedIds]).toEqual(["folder-2"]);
    expect(dragReducer(peeked, { action: "addPeek", id: "folder-2" })).toBe(
      peeked,
    );
  });

  it("adds a Drag Source once", () => {
    const added = dragReducer(dragging(), {
      action: "addSource",
      id: "bookmark-3",
    });
    expect([...added.sourceIds]).toEqual(["bookmark-1", "bookmark-3"]);
    expect(dragReducer(added, { action: "addSource", id: "bookmark-3" })).toBe(
      added,
    );
  });

  it("ignores removing a Drag Source that isn't dragging", () => {
    const state = dragging();
    expect(
      dragReducer(state, { action: "removeSource", id: "bookmark-9" }),
    ).toBe(state);
  });

  it.fails("removes a Drag Source (#40)", () => {
    const state = dragReducer(dragging(), {
      action: "removeSource",
      id: "bookmark-1",
    });
    expect(state.sourceIds.size).toBe(0);
  });
});
