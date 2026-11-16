import type { CSSProperties } from "react";
import type { DragId, DragPosition } from "./dragTypes";

export interface DragState {
  sourceIds: Set<DragId>;
  destinationId?: DragId;
  position?: DragPosition;
  /** Where the drop marker is drawn for the Drop Position. */
  indicator?: CSSProperties;
  peekedIds: Set<DragId>;
}

export type DragAction =
  | {
      action: "addPeek";
      id: DragId;
    }
  | {
      action: "setDestination";
      id: DragId;
      position: DragPosition;
      indicator: CSSProperties;
    }
  | {
      action: "startDrag";
      id: DragId;
    }
  | {
      action: "endDrag" | "removeDestination";
    };

export const initialDragState: DragState = {
  sourceIds: new Set(),
  peekedIds: new Set(),
};

const isIdle = (state: DragState) =>
  !state.sourceIds.size && !state.peekedIds.size && !state.destinationId;

export const dragReducer = (
  state: DragState,
  action: DragAction,
): DragState => {
  switch (action.action) {
    case "startDrag": {
      const sourceIds = new Set(state.sourceIds);
      sourceIds.add(action.id);
      return { ...state, sourceIds };
    }
    case "endDrag":
      // A drop ends the drag, then dragend ends it again.
      return isIdle(state) ? state : initialDragState;
    case "addPeek": {
      if (state.peekedIds.has(action.id)) {
        return state;
      }
      const peekedIds = new Set([...state.peekedIds, action.id]);
      return { ...state, peekedIds };
    }
    case "removeDestination": {
      if (!state.destinationId) {
        return state;
      }
      return {
        ...state,
        destinationId: undefined,
        position: undefined,
        indicator: undefined,
      };
    }
    case "setDestination":
      if (
        state.destinationId === action.id &&
        state.position === action.position
      ) {
        return state;
      }
      return {
        ...state,
        destinationId: action.id,
        position: action.position,
        indicator: action.indicator,
      };
  }
};
