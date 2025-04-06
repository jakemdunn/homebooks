import {
  useFloating,
  useInteractions,
  autoUpdate,
  flip,
  FloatingList,
  FloatingPortal,
  ReferenceType,
  useDismiss,
  useListNavigation,
  useTransitionStyles,
  useTypeahead,
} from "@floating-ui/react";
import {
  FC,
  PropsWithChildren,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useConditionalClassNames } from "../../util/useConditionalClassNames";
import { DragId } from "../drag/dragProvider.util";
import { menuStyle } from "./floatingMenu.css";
import {
  FloatingMenuContext,
  FloatingMenuContextState,
} from "./floatingMenu.context";
import { useFloatingMenusContext } from "./floatingMenu.handler.context";

export interface FloatingMenuProps {
  items: ReactElement;
  reference: ReferenceType;
  type: "context" | "menu";
  dragId: DragId;
}

export const FloatingMenu: FC<PropsWithChildren<FloatingMenuProps>> = ({
  items,
  type,
  reference,
  dragId,
}) => {
  const { dispatch } = useFloatingMenusContext();
  const [open, onOpenChange] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const { refs, floatingStyles, context, placement } = useFloating({
    open,
    onOpenChange,
    whileElementsMounted: autoUpdate,
    placement: type === "context" ? "bottom-start" : "top-end",
    middleware: [
      flip({
        padding: {
          top: 50,
        },
      }),
    ],
  });
  const { isMounted, styles } = useTransitionStyles(context, {
    duration: 200,
    initial: ({ side }) => ({
      clipPath:
        side === "top"
          ? "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)"
          : "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
    }),
    open: ({ side }) => ({
      clipPath:
        side === "top"
          ? "polygon(-10% -10%, 110% -10%, 110% 100%, -10% 100%)"
          : "polygon(-10% 0%, 110% 0%, 110% 110%, -10% 110%)",
    }),
  });
  const dismiss = useDismiss(context, {
    referencePress: true,
    referencePressEvent: "click",
    outsidePress: (event) => {
      if (event.button !== 2) return true;
      const closestDragElement = (event.target as HTMLElement)?.closest(
        `[data-drag-id]`
      );
      return closestDragElement?.getAttribute("data-drag-id") !== dragId;
    },
  });
  const listRef = useRef<(HTMLElement | null)[]>([]);
  const labelsRef = useRef<string[]>([]);

  const typeahead = useTypeahead(context, {
    listRef: labelsRef,
    activeIndex,
    onMatch: setActiveIndex,
  });

  const listNavigation = useListNavigation(context, {
    listRef,
    activeIndex,
    onNavigate: setActiveIndex,
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions(
    [dismiss, listNavigation, typeahead]
  );

  const closeMenu = useCallback(() => onOpenChange(false), []);

  const contextState = useMemo<FloatingMenuContextState>(
    () => ({
      activeIndex,
      getItemProps,
      closeMenu,
      open,
      isMounted,
      placement,
      setReference: refs.setReference,
      getReferenceProps,
    }),
    [
      activeIndex,
      closeMenu,
      getItemProps,
      getReferenceProps,
      isMounted,
      open,
      placement,
      refs.setReference,
    ]
  );
  useEffect(() => {
    dispatch({ type: "setState", dragId, state: contextState });
  }, [contextState, dispatch, dragId]);

  const menuClassNames = useConditionalClassNames(
    {
      contextualMenu: () => type === "context",
    },
    menuStyle,
    placement
  );

  useEffect(() => {
    refs.setReference(reference);
  }, [refs, reference]);

  useEffect(() => {
    if (!isMounted) {
      dispatch({ type: "removeMenu", dragId });
    }
  }, [dispatch, dragId, isMounted]);

  return (
    <FloatingMenuContext.Provider value={contextState}>
      {isMounted && (
        <FloatingPortal>
          <FloatingList elementsRef={listRef} labelsRef={labelsRef}>
            <div
              ref={refs.setFloating}
              className={menuClassNames}
              style={{ ...floatingStyles, ...styles }}
              {...getFloatingProps()}
            >
              {items}
            </div>
          </FloatingList>
        </FloatingPortal>
      )}
    </FloatingMenuContext.Provider>
  );
};
