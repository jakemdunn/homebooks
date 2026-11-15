import {
  FC,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { indicatorStyle } from "./dragProvider.css";
import {
  DataTransferSource,
  getSources,
  processDataTransfer,
  useGetEventData,
} from "./dragProvider.util";
import { DragContextProps, DragContext } from "./dragContext";
import { getDropPosition } from "./dropPosition";
import { dragReducer, initialDragState } from "./dragReducer";

export const DragProvider: FC<React.PropsWithChildren> = ({ children }) => {
  const { eventData, getEventData } = useGetEventData();
  const [dragState, dragDispatch] = useReducer(dragReducer, initialDragState);
  const [sources, setSources] = useState<DataTransferSource[]>([]);
  useEffect(() => {
    (async () => {
      const updatedSources =
        (await getSources([...dragState.sourceIds], true)) ?? [];
      setSources(updatedSources);
    })();
  }, [dragState.sourceIds]);

  const onDragStart = useCallback<React.DragEventHandler<HTMLElement>>(
    (event) => {
      const { id, target } = getEventData(event);
      if (!id || !target) return;
      dragDispatch({
        action: "startDrag",
        id,
      });
    },
    [getEventData],
  );

  const onDragEnd = useCallback<React.DragEventHandler<HTMLElement>>(() => {
    dragDispatch({
      action: "endDrag",
    });
  }, []);

  const onDragLeave = useCallback<React.DragEventHandler<HTMLElement>>(
    (event) => {
      const { id, target } = getEventData(event);
      if (!id || !target) return;
      dragDispatch({
        action: "removeDestination",
      });
    },
    [getEventData],
  );

  const onDragOver = useCallback<React.DragEventHandler<HTMLElement>>(
    (event) => {
      const { id, target } = getEventData(event);
      if (!id || !target) return;
      event.preventDefault();
      dragDispatch({
        action: "setDestination",
        id,
        position: getDropPosition(
          target.getBoundingClientRect(),
          event.clientX,
          event.clientY,
        ),
      });
    },
    [getEventData],
  );

  const onDrop = useCallback<React.DragEventHandler<HTMLElement>>(
    (event) => {
      const position = dragState.position;
      const sourceIds = dragState.sourceIds;
      const { id, target } = getEventData(event);

      dragDispatch({
        action: "endDrag",
      });

      const droppedOnSelf = id && sourceIds.has(id);
      if (droppedOnSelf || !id || !target || !position) return;

      // TODO: Handle file drop for Toby Import

      processDataTransfer(event, position);
      event.preventDefault();
    },
    [dragState.position, dragState.sourceIds, getEventData],
  );

  const [indicator, setIndicator] = useState<React.CSSProperties>({});
  useEffect(() => {
    if (!dragState.destinationId) {
      setIndicator({});
      return;
    }
    const { target } = eventData.current ?? {};
    const container = target?.closest("[data-grid-container]");
    if (!target || !container) {
      setIndicator({});
      return;
    }

    const targetBounds = target.getBoundingClientRect();
    const containerBounds = container.getBoundingClientRect();

    switch (dragState.position) {
      case "left":
        setIndicator({
          width: 0,
          height: targetBounds.height - 15,
          top: targetBounds.top + 5,
          left: targetBounds.left - 2,
        });
        break;
      case "right":
        setIndicator({
          width: 0,
          height: targetBounds.height - 15,
          top: targetBounds.top + 5,
          left: targetBounds.right - 2,
        });
        break;
      case "top":
        setIndicator({
          width: containerBounds.width - 15,
          height: 0,
          top: targetBounds.top - 2,
          left: containerBounds.left + 5,
        });
        break;
      case "bottom":
        setIndicator({
          width: containerBounds.width - 15,
          height: 0,
          top: targetBounds.bottom - 2,
          left: containerBounds.left + 5,
        });
        break;
      case "in":
        setIndicator({
          width: `calc(${targetBounds.width}px - 0.5rem)`,
          height: `calc(${targetBounds.height}px - 0.5rem)`,
          top: `calc(${targetBounds.top}px + 0.25rem)`,
          left: `calc(${targetBounds.left}px + 0.25rem)`,
        });
        break;
    }
  }, [dragState, eventData]);

  const dragOverTimeout = useRef<NodeJS.Timeout>(undefined);
  useEffect(() => {
    const isContainer = !!(
      dragState.position === "in" &&
      dragState.destinationId &&
      document
        .querySelector(`[data-drag-id="${dragState.destinationId}"]`)
        ?.attributes.getNamedItem("data-container")
    );
    if (isContainer) {
      dragOverTimeout.current = setTimeout(() => {
        startTransition(() => {
          dragDispatch({ action: "addPeek", id: dragState.destinationId! });
        });
      }, 700);
    }
    return () => clearTimeout(dragOverTimeout.current);
  }, [dragState.destinationId, dragState.position]);

  const dragSurfaceHandlers = useMemo(
    () => ({
      onDragStart,
      onDragEnd,
      onDragLeave,
      onDragOver,
      onDrop,
    }),
    [onDragStart, onDragEnd, onDragLeave, onDragOver, onDrop],
  );

  const dragContextState = useMemo<DragContextProps>(
    () => ({
      ...dragState,
      sources,
      dragSurfaceHandlers,
      dragIndicator: {
        className: indicatorStyle,
        style: indicator,
      },
    }),
    [dragState, sources, dragSurfaceHandlers, indicator],
  );

  return (
    <DragContext.Provider value={dragContextState}>
      {children}
    </DragContext.Provider>
  );
};
