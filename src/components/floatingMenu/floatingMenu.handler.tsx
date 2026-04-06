import { FC, useCallback, useMemo, useReducer } from "react";
import { FloatingMenuItems } from "../floatingMenu/floatingMenuItems";
import { FloatingMenu } from "../floatingMenu/floatingMenu";
import { DragId, getEventData } from "../drag/dragProvider.util";
import { useDragContext } from "../drag/dragContext";
import { useSettingsStorage } from "../../util/storage.types";
import {
  FloatingMenusContextState,
  FloatingMenusAction,
  FloatingMenusContextItem,
  FloatingMenusContext,
} from "./floatingMenu.handler.context";

export const FloatingMenuHandler: FC<
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
> = ({ children, ...props }) => {
  const { dragSurfaceHandlers, dragIndicator } = useDragContext();
  const [menus, dispatch] = useReducer<
    FloatingMenusContextState["menus"],
    [FloatingMenusAction]
  >((state, action) => {
    switch (action.type) {
      case "addMenu":
        return {
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
  const [settings] = useSettingsStorage();
  const onContextMenu = useCallback<React.MouseEventHandler<HTMLElement>>(
    (event) => {
      if (settings?.contextMenus === "contextMenuOptionDisplayed") return;
      const { id: dragId, target } = getEventData(event);
      if (!dragId || !target) return;

      event.preventDefault();
      event.stopPropagation();

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
    [settings?.contextMenus]
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
      <main
        {...props}
        {...(dragSurfaceHandlers ?? {})}
        onContextMenu={onContextMenu}
      >
        {dragIndicator ? (
          <div
            className={dragIndicator.className}
            style={dragIndicator.style}
          />
        ) : null}
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
