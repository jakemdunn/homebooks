import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { indicatorStyle } from "./dragContext.css";
import {
  DataTransferSource,
  DragId,
  DragPosition,
  getEventData,
  getSources,
  processDataTransfer,
} from "./dragContext.util";
import { FloatingMenuHandler } from "../floatingMenu/floatingMenu.handler";

interface DragState {
  dragging: boolean;
  sourceIds: Set<DragId>;
  destinationId?: DragId;
  position?: DragPosition;
  peekedIds: Set<DragId>;
}
interface DragContextProps extends DragState {
  sources: DataTransferSource[];
}

const DragContext = createContext<DragContextProps>({} as DragContextProps);
export const useDragContext = () => useContext(DragContext);

type DragAction =
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

export const DragProvider: FC<PropsWithChildren> = ({ children }) => {
  const [dragState, dragDispatch] = useReducer<DragState, [DragAction]>(
    (state, action) => {
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
            sources: new Set(),
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
    },
    {
      sourceIds: new Set(),
      peekedIds: new Set(),
      dragging: false,
    }
  );
  const [sources, setSources] = useState<DataTransferSource[]>([]);
  useEffect(() => {
    (async () => {
      const updatedSources =
        (await getSources([...dragState.sourceIds], true)) ?? [];
      setSources(updatedSources);
    })();
  }, [dragState.sourceIds]);

  const getPosition = useCallback<
    (
      target: Element,
      event: React.DragEvent<HTMLElement>
    ) => DragState["position"]
  >((target, event) => {
    const rect = target.getBoundingClientRect();

    const INSET = 15;
    if (
      event.clientY > rect.top + INSET &&
      event.clientY < rect.bottom - INSET &&
      event.clientX > rect.left + INSET &&
      event.clientX < rect.right - INSET
    ) {
      return "in";
    }

    const biasDepth = Math.min(rect.width, rect.height) * 0.5;
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    let xBias = 0;
    if (x < biasDepth) xBias = -(1 - x / biasDepth);
    else if (x > rect.width - biasDepth)
      xBias = (x - rect.width + biasDepth) / biasDepth;

    let yBias = 0;
    if (y < biasDepth) yBias = -(1 - y / biasDepth);
    else if (y > rect.height - biasDepth)
      yBias = (y - rect.height + biasDepth) / biasDepth;

    const orientationBias = Math.abs(xBias) > Math.abs(yBias) ? "x" : "y";

    if (orientationBias === "y" && yBias < 0) return "top";
    if (orientationBias === "y" && yBias > 0) return "bottom";
    if (orientationBias === "x" && xBias < 0) return "left";
    if (orientationBias === "x" && xBias > 0) return "right";
    return rect.width > rect.height ? "bottom" : "right";
  }, []);

  const onDragStart = useCallback<React.DragEventHandler<HTMLElement>>(
    (event) => {
      const { id, target } = getEventData(event);
      if (!id || !target) return;
      dragDispatch({
        action: "startDrag",
        id,
      });
    },
    []
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
    []
  );

  const onDragOver = useCallback<React.DragEventHandler<HTMLElement>>(
    (event) => {
      const { id, target } = getEventData(event);
      if (!id || !target) return;
      event.preventDefault();
      dragDispatch({
        action: "setDestination",
        id,
        position: getPosition(target, event),
      });
    },
    [getPosition]
  );

  const onDrop = useCallback<React.DragEventHandler<HTMLElement>>(
    (event) => {
      dragDispatch({
        action: "endDrag",
      });

      const { id, target } = getEventData(event);
      if (!id || !target || !dragState.position) return;

      processDataTransfer(event, dragState.position);
      event.preventDefault();
    },
    [dragState.position]
  );

  const [indicator, setIndicator] = useState<React.CSSProperties>({});
  useEffect(() => {
    if (!dragState.destinationId) {
      setIndicator({});
      return;
    }
    const target = document.querySelector(
      `[data-drag-id="${dragState.destinationId}"]`
    );
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
  }, [dragState]);

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
        dragDispatch({ action: "addPeek", id: dragState.destinationId! });
      }, 700);
    }
    return () => clearTimeout(dragOverTimeout.current);
  });

  const dragContextState = useMemo<DragContextProps>(
    () => ({
      ...dragState,
      sources,
    }),
    [dragState, sources]
  );

  return (
    <DragContext.Provider value={dragContextState}>
      <FloatingMenuHandler
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <div className={indicatorStyle} style={indicator} />
        {children}
      </FloatingMenuHandler>
    </DragContext.Provider>
  );
};
