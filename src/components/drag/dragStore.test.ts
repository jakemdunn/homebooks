import { describe, expect, it, vi } from "vitest";
import { createDragStore } from "./dragStore";

describe("drag store", () => {
  it("starts with nothing dragged", () => {
    const state = createDragStore().getState();
    expect(state.sourceIds.size).toBe(0);
    expect(state.destinationId).toBeUndefined();
  });

  it("applies actions through the drag reducer", () => {
    const store = createDragStore();
    store.dispatch({ action: "startDrag", id: "bookmark-1" });
    store.dispatch({
      action: "setDestination",
      id: "bookmark-2",
      position: "left",
      indicator: {},
    });

    expect(store.getState()).toMatchObject({
      destinationId: "bookmark-2",
      position: "left",
    });
    expect([...store.getState().sourceIds]).toEqual(["bookmark-1"]);
  });

  it("notifies subscribers when the state changes", () => {
    const store = createDragStore();
    const listener = vi.fn();
    store.subscribe(listener);

    store.dispatch({
      action: "setDestination",
      id: "bookmark-2",
      position: "left",
      indicator: {},
    });

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("doesn't notify when an action leaves the state unchanged", () => {
    const store = createDragStore();
    store.dispatch({
      action: "setDestination",
      id: "bookmark-2",
      position: "left",
      indicator: {},
    });
    const listener = vi.fn();
    store.subscribe(listener);

    store.dispatch({
      action: "setDestination",
      id: "bookmark-2",
      position: "left",
      indicator: {},
    });

    expect(listener).not.toHaveBeenCalled();
  });

  it("stops notifying once unsubscribed", () => {
    const store = createDragStore();
    const listener = vi.fn();
    store.subscribe(listener)();

    store.dispatch({ action: "startDrag", id: "bookmark-1" });

    expect(listener).not.toHaveBeenCalled();
  });
});
