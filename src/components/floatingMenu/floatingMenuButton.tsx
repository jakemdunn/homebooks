import { FC, useMemo } from "react";
import { useConditionalClassNames } from "../../util/useConditionalClassNames";
import { buttonContentsStyle, buttonStyle } from "./floatingMenu.css";
import { FloatingMenuContextState } from "./floatingMenu";
import { DragId } from "../drag/dragContext.util";
import { useFloatingMenusContext } from "./floatingMenu.handler";

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
    className,
    buttonStyle,
    placement
  );

  return (
    <button
      type="button"
      onClick={(event) =>
        dispatch({
          type: "addMenu",
          menuType: "menu",
          dragId,
          reference: event.target as HTMLElement,
        })
      }
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
