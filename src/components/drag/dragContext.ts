import {
  createContext,
  useContext,
  type CSSProperties,
  type DragEventHandler,
} from "react";
import { DragId, DragPosition, DataTransferSource } from "./dragProvider.util";

export interface DragState {
  dragging: boolean;
  sourceIds: Set<DragId>;
  destinationId?: DragId;
  position?: DragPosition;
  peekedIds: Set<DragId>;
}

export interface DragSurfaceHandlers {
  onDragStart: DragEventHandler<HTMLElement>;
  onDragEnd: DragEventHandler<HTMLElement>;
  onDragLeave: DragEventHandler<HTMLElement>;
  onDragOver: DragEventHandler<HTMLElement>;
  onDrop: DragEventHandler<HTMLElement>;
}

export interface DragContextProps extends DragState {
  sources: DataTransferSource[];
  dragSurfaceHandlers: DragSurfaceHandlers;
  dragIndicator: {
    className: string;
    style: CSSProperties;
  };
}

export const DragContext = createContext<DragContextProps>(
  {} as DragContextProps
);
export const useDragContext = () => useContext(DragContext);
