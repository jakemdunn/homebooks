import type { DragState } from "./dragReducer";
import { DragAction, dragReducer, initialDragState } from "./dragReducer";

/**
 * The drag state, held outside React so each component can subscribe to
 * just the part it shows (see useDragSelector). A Drop Destination change
 * then re-renders only what depends on it, not every tile on the page.
 */
export type DragStore = {
  getState: () => DragState;
  dispatch: (action: DragAction) => void;
  subscribe: (listener: () => void) => () => void;
};

export const createDragStore = (): DragStore => {
  let state = initialDragState;
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    dispatch: (action) => {
      const next = dragReducer(state, action);
      if (next === state) return;
      state = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};
