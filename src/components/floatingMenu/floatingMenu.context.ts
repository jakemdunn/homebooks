import { useInteractions, Placement, useFloating } from "@floating-ui/react";
import { createContext, useContext } from "react";

export interface FloatingMenuContextState {
  activeIndex?: number | null;
  getItemProps: ReturnType<typeof useInteractions>["getItemProps"];
  closeMenu: () => void;
  open: boolean;
  isMounted: boolean;
  placement: Placement;
  buttonRef?: React.RefObject<Element | undefined>; //TODO: Deleted, or refactored
  setReference: ReturnType<typeof useFloating>["refs"]["setReference"];
  getReferenceProps: ReturnType<typeof useInteractions>["getReferenceProps"];
}
export const FloatingMenuContext = createContext<FloatingMenuContextState>(
  {} as FloatingMenuContextState
);
export const useFloatingMenuContext = () => useContext(FloatingMenuContext);
