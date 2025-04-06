import { createContext, useContext } from "react";
import { DragId, DragPosition, DataTransferSource } from "./dragProvider.util";

export interface DragState {
  dragging: boolean;
  sourceIds: Set<DragId>;
  destinationId?: DragId;
  position?: DragPosition;
  peekedIds: Set<DragId>;
}

export interface DragContextProps extends DragState {
  sources: DataTransferSource[];
}

export const DragContext = createContext<DragContextProps>(
  {} as DragContextProps
);
export const useDragContext = () => useContext(DragContext);
