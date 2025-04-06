import { ReferenceType } from "@floating-ui/react";
import { createContext, useContext } from "react";
import { DragId } from "../drag/dragProvider.util";
import { FloatingMenuProps } from "./floatingMenu";
import { FloatingMenuContextState } from "./floatingMenu.context";

export interface FloatingMenusContextItem {
  reference: ReferenceType;
  state?: FloatingMenuContextState;
  type: FloatingMenuProps["type"];
}
export interface FloatingMenusContextState {
  menus: Record<DragId, FloatingMenusContextItem>;
  dispatch: React.ActionDispatch<[FloatingMenusAction]>;
}
export type FloatingMenusAction =
  | {
      type: "removeMenu";
      dragId: DragId;
    }
  | {
      type: "addMenu";
      dragId: DragId;
      reference: ReferenceType;
      menuType: FloatingMenuProps["type"];
    }
  | {
      type: "setState";
      dragId: DragId;
      state: FloatingMenuContextState;
    };
export const FloatingMenusContext = createContext<FloatingMenusContextState>(
  {} as FloatingMenusContextState
);
export const useFloatingMenusContext = () => useContext(FloatingMenusContext);
