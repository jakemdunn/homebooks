import { FC, useMemo } from "react";
import { useConditionalClassNames } from "../../util/useConditionalClassNames";
import { buttonContentsStyle, buttonStyle } from "./floatingMenu.css";
import { DragId } from "../drag/dragProvider.util";
import { FloatingMenuContextState } from "./floatingMenu.context";
import { useFloatingMenusContext } from "./floatingMenu.handler.context";

export const FloatingMenuButton: FC<
  { dragId: DragId } & React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
> = ({ className, children, dragId, ...props }) => {
  const { menus, dispatch } = useFloatingMenusContext();
  const {
    open,
    isMounted,
    placement,
    buttonRef,
    setReference,
    getReferenceProps,
  } = useMemo<Partial<FloatingMenuContextState>>(
    () => menus[dragId]?.state ?? {},
    [dragId, menus]
  );
  const buttonStyles = useConditionalClassNames(
    {
      open: () => !!open,
      mounted: () => !!isMounted,
    },
    buttonStyle,
    placement,
    className
  );

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        dispatch({
          type: "addMenu",
          menuType: "menu",
          dragId,
          reference: event.target as HTMLElement,
        });
      }}
      ref={(button) => {
        if (buttonRef) {
          buttonRef.current = button as Element;
        }
        setReference?.(button);
      }}
      className={buttonStyles}
      {...props}
      {...getReferenceProps?.()}
    >
      <span className={buttonContentsStyle}>{children}</span>
    </button>
  );
};
