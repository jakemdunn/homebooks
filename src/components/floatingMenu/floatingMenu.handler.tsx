import {
  createContext,
  FC,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from "react";
import { FloatingMenuItems } from "../floatingMenu/floatingMenuItems";
import { ReferenceType } from "@floating-ui/react";
import {
  FloatingMenu,
  FloatingMenuContextState,
  FloatingMenuProps,
} from "../floatingMenu/floatingMenu";
import { DragId, getEventData } from "../drag/dragContext.util";

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
const FloatingMenusContext = createContext<FloatingMenusContextState>(
  {} as FloatingMenusContextState
);
export const useFloatingMenusContext = () => useContext(FloatingMenusContext);

export const FloatingMenuHandler: FC<
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
> = ({ children, ...props }) => {
  const [menus, dispatch] = useReducer<
    FloatingMenusContextState["menus"],
    [FloatingMenusAction]
  >((state, action) => {
    switch (action.type) {
      case "addMenu":
        return {
          ...state,
          [action.dragId]: {
            reference: action.reference,
            type: action.menuType,
          },
        };
      case "setState":
        return {
          ...state,
          [action.dragId]: {
            ...state[action.dragId],
            state: action.state,
          },
        };
      case "removeMenu": {
        const updated = { ...state };
        delete updated[action.dragId];
        return updated;
      }
    }
  }, {});
  const targets = useMemo(
    () => Object.entries(menus) as [DragId, FloatingMenusContextItem][],
    [menus]
  );
  const onContextMenu = useCallback<React.MouseEventHandler<HTMLElement>>(
    (event) => {
      const { id: dragId, target } = getEventData(event);
      if (!dragId || !target) return;

      event.preventDefault();
      event.stopPropagation();
      dispatch({ type: "removeMenu", dragId });

      const baseRect = target.getBoundingClientRect();
      const offset = {
        x: event.clientX - baseRect.x,
        y: event.clientY - baseRect.y,
      };

      dispatch({
        type: "addMenu",
        dragId,
        menuType: "context",
        reference: {
          getBoundingClientRect() {
            const updatedRect = target.getBoundingClientRect();
            const position = updatedRect
              ? {
                  x: updatedRect.x + offset.x,
                  y: updatedRect.y + offset.y,
                }
              : {
                  x: event.clientX,
                  y: event.clientY,
                };
            return {
              x: position.x,
              y: position.y,
              top: position.y,
              left: position.x,
              bottom: position.y,
              right: position.x,
              width: 0,
              height: 0,
            };
          },
          contextElement: target,
        },
      });
    },
    []
  );

  const floatingMenusContext = useMemo<FloatingMenusContextState>(
    () => ({
      menus,
      dispatch,
    }),
    [menus]
  );

  return (
    <FloatingMenusContext value={floatingMenusContext}>
      <main {...props} onContextMenu={onContextMenu}>
        {children}
        {targets.map(([dragId, target]) => (
          <FloatingMenu
            key={dragId}
            dragId={dragId}
            reference={target.reference}
            type={target.type}
            items={<FloatingMenuItems dragId={dragId} />}
          />
        ))}
      </main>
    </FloatingMenusContext>
  );
};
