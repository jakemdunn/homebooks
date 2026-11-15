import type { DragState } from "./dragContext";
import type { DragId } from "./dragTypes";

export type DragAction =
  | {
      action: "addSource" | "removeSource" | "addPeek";
      id: DragId;
    }
  | {
      action: "setDestination";
      id: DragId;
      position: DragState["position"];
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
  dragging: false,
};

export const dragReducer = (
  state: DragState,
  action: DragAction,
): DragState => {
  switch (action.action) {
    case "startDrag": {
      const sourceIds = new Set(state.sourceIds);
      sourceIds.add(action.id);
      return {
        ...state,
        dragging: true,
        sourceIds,
      };
    }
    case "endDrag":
      return {
        ...state,
        dragging: false,
        sourceIds: new Set(),
        peekedIds: new Set(),
        destinationId: undefined,
        position: undefined,
      };
    case "addSource": {
      if (state.sourceIds.has(action.id)) {
        return state;
      }
      const sourceIds = new Set([...state.sourceIds, action.id]);
      return { ...state, sourceIds };
    }
    case "addPeek": {
      if (state.peekedIds.has(action.id)) {
        return state;
      }
      const peekedIds = new Set([...state.peekedIds, action.id]);
      return {
        ...state,
        peekedIds,
      };
    }
    case "removeSource": {
      if (!state.sourceIds.has(action.id)) {
        return state;
      }
      const sourceIds = new Set(state.sourceIds);
      sourceIds.delete(action.id);
      return { ...state, sourceIds: new Set(state.sourceIds) };
    }
    case "removeDestination": {
      if (!state.destinationId) {
        return state;
      }
      return { ...state, destinationId: undefined, position: undefined };
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
      };
  }
};
