import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type DragEventHandler,
  type RefObject,
} from "react";
import type { DataTransferSource } from "./dragProvider.util";
import type { DragState } from "./dragReducer";
import type { DragStore } from "./dragStore";

export interface DragSurfaceHandlers {
  onDragStart: DragEventHandler<HTMLElement>;
  onDragEnd: DragEventHandler<HTMLElement>;
  onDragLeave: DragEventHandler<HTMLElement>;
  onDragOver: DragEventHandler<HTMLElement>;
  onDrop: DragEventHandler<HTMLElement>;
}

/** Never changes identity, so providing it re-renders nothing mid-drag. */
export interface DragContextValue {
  store: DragStore;
  dragSurfaceHandlers: DragSurfaceHandlers;
  /** The Drag Sources' bookmark data, read when a drag starts. */
  sources: RefObject<DataTransferSource[]>;
}

export const DragContext = createContext<DragContextValue | undefined>(
  undefined,
);

export const useDragContext = () => {
  const value = useContext(DragContext);
  if (!value) throw new Error("useDragContext needs a DragProvider");
  return value;
};

/**
 * The part of the drag state `selector` picks. The component re-renders only
 * when that part changes, so return a primitive or an existing object.
 * Renders synchronously, even for a dispatch inside a transition, so it
 * can't animate: see usePeekedIds.
 */
export const useDragSelector = <T>(selector: (state: DragState) => T) => {
  const { store } = useDragContext();
  return useSyncExternalStore(store.subscribe, () =>
    selector(store.getState()),
  );
};

/**
 * The Peeked containers, held in React state so a Peek dispatched inside a
 * transition (see DragProvider) renders inside it and its Folder animates
 * open. useDragSelector would render it synchronously.
 */
export const usePeekedIds = () => {
  const { store } = useDragContext();
  const [peekedIds, setPeekedIds] = useState(() => store.getState().peekedIds);
  useEffect(() => {
    // Catch a Peek that landed between the first render and subscribing.
    let shown = store.getState().peekedIds;
    setPeekedIds(shown);
    // Most store changes are Drop Destination moves: skip those.
    return store.subscribe(() => {
      const next = store.getState().peekedIds;
      if (next === shown) return;
      shown = next;
      setPeekedIds(next);
    });
  }, [store]);
  return peekedIds;
};
