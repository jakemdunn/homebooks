import {
  DragEvent,
  FC,
  PropsWithChildren,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DataTransferSource,
  getEventData,
  getSources,
  processDataTransfer,
} from "./dragProvider.util";
import {
  DragContext,
  DragContextValue,
  DragSurfaceHandlers,
} from "./dragContext";
import { getDropPosition } from "./dropPosition";
import { dropIndicatorBounds } from "./dropIndicatorBounds";
import { createDragStore, DragStore } from "./dragStore";
import { DragId } from "./dragTypes";
import {
  regionOf,
  startRegionTransition,
} from "../../util/viewTransitionRegion";

/** How long a Drag Source must rest "in" a container before it Peeks. */
const PEEK_DELAY = 700;

const isContainer = (id: DragId) =>
  !!document
    .querySelector(`[data-drag-id="${id}"]`)
    ?.attributes.getNamedItem("data-container");

/**
 * Peeks a container once a Drag Source has rested "in" it for PEEK_DELAY.
 * Driven by the store, so the provider itself never re-renders mid-drag.
 * The Peek is dispatched inside a transition so its Folder animates open
 * (see usePeekedIds).
 */
const peekWhenResting = (store: DragStore) => {
  let resting: DragId | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const unsubscribe = store.subscribe(() => {
    const { destinationId, position } = store.getState();
    const next = position === "in" ? destinationId : undefined;
    if (next === resting) return;
    resting = next;
    clearTimeout(timeout);
    if (next && isContainer(next))
      timeout = setTimeout(
        () =>
          startRegionTransition([regionOf(next)], () =>
            store.dispatch({ action: "addPeek", id: next }),
          ),
        PEEK_DELAY,
      );
  });
  return () => {
    unsubscribe();
    clearTimeout(timeout);
  };
};

/** Keeps `sources` holding the bookmark data of the current Drag Sources. */
const syncSourcesFromStore = (
  store: DragStore,
  sources: { current: DataTransferSource[] },
) => {
  let synced = store.getState().sourceIds;
  return store.subscribe(() => {
    const { sourceIds } = store.getState();
    if (sourceIds === synced) return;
    synced = sourceIds;
    getSources([...sourceIds], true).then((found) => {
      if (store.getState().sourceIds === sourceIds)
        sources.current = found ?? [];
    });
  });
};

/** The Drag Source or Drop Destination under an event, if it's one of ours. */
const dragTargetOf = (event: DragEvent<HTMLElement>) => {
  const { id, target } = getEventData(event);
  return id && target ? { id, target } : undefined;
};

export const DragProvider: FC<PropsWithChildren> = ({ children }) => {
  const [store] = useState(createDragStore);
  const sources = useRef<DataTransferSource[]>([]);

  useEffect(() => peekWhenResting(store), [store]);
  useEffect(() => syncSourcesFromStore(store, sources), [store]);

  const dragSurfaceHandlers = useMemo<DragSurfaceHandlers>(
    () => ({
      onDragStart: (event) => {
        const dragged = dragTargetOf(event);
        if (dragged) store.dispatch({ action: "startDrag", id: dragged.id });
      },
      onDragEnd: () => store.dispatch({ action: "endDrag" }),
      onDragLeave: (event) => {
        if (dragTargetOf(event))
          store.dispatch({ action: "removeDestination" });
      },
      onDragOver: (event) => {
        const over = dragTargetOf(event);
        if (!over) return;
        event.preventDefault();
        const position = getDropPosition(
          over.target.getBoundingClientRect(),
          event.clientX,
          event.clientY,
        );
        const { destinationId, position: shown } = store.getState();
        // Measure the marker only when it moves: dragover fires constantly.
        if (destinationId === over.id && shown === position) return;
        store.dispatch({
          action: "setDestination",
          id: over.id,
          position,
          indicator: dropIndicatorBounds(over.target, position),
        });
      },
      onDrop: (event) => {
        const { position, sourceIds } = store.getState();
        const dropped = dragTargetOf(event);
        store.dispatch({ action: "endDrag" });

        if (!dropped || sourceIds.has(dropped.id) || !position) return;

        // TODO: Handle file drop for Toby Import

        processDataTransfer(event, position).catch((error) =>
          console.error("The drop failed.", error),
        );
        event.preventDefault();
      },
    }),
    [store],
  );

  const value = useMemo<DragContextValue>(
    () => ({ store, dragSurfaceHandlers, sources }),
    [store, dragSurfaceHandlers],
  );

  return <DragContext.Provider value={value}>{children}</DragContext.Provider>;
};
