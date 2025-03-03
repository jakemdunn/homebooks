import {
  useFloating,
  autoUpdate,
  FloatingPortal,
  useClick,
  useInteractions,
  useDismiss,
  flip,
  useTransitionStyles,
  useListNavigation,
  useTypeahead,
  FloatingList,
} from "@floating-ui/react";
import {
  createContext,
  FC,
  PropsWithChildren,
  ReactElement,
  useContext,
  useRef,
  useState,
} from "react";
import {
  buttonContentsStyle,
  buttonStyle,
  menuStyle,
} from "./floatingMenu.css";
import { useConditionalClassNames } from "../../util/useConditionalClassNames";

export interface FloatingMenuProps
  extends React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  items: ReactElement;
}

interface FloatingMenuContextState {
  activeIndex?: number | null;
  getItemProps: ReturnType<typeof useInteractions>["getItemProps"];
}
const FloatingMenuContext = createContext<FloatingMenuContextState>(
  {} as FloatingMenuContextState,
);
export const useFloatingMenuContext = () => useContext(FloatingMenuContext);

export const FloatingMenu: FC<PropsWithChildren<FloatingMenuProps>> = ({
  items,
  className,
  children,
  ...props
}) => {
  const [open, onOpenChange] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const { refs, floatingStyles, context, placement } = useFloating({
    open,
    onOpenChange,
    whileElementsMounted: autoUpdate,
    placement: "top-end",
    middleware: [
      flip({
        padding: 50,
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
  const click = useClick(context);
  const dismiss = useDismiss(context);

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
    [click, dismiss, listNavigation, typeahead],
  );

  const buttonStyles = useConditionalClassNames(
    {
      open: () => open,
      mounted: () => isMounted,
    },
    className,
    buttonStyle,
    placement,
  );

  return (
    <>
      <button
        type="button"
        ref={refs.setReference}
        className={buttonStyles}
        {...props}
        {...getReferenceProps()}
      >
        <span className={buttonContentsStyle}>{children}</span>
      </button>
      {isMounted && (
        <FloatingPortal>
          <FloatingList elementsRef={listRef} labelsRef={labelsRef}>
            <FloatingMenuContext value={{ activeIndex, getItemProps }}>
              <div
                ref={refs.setFloating}
                className={[menuStyle, placement].join(" ")}
                style={{ ...floatingStyles, ...styles }}
                {...getFloatingProps()}
              >
                {items}
              </div>
            </FloatingMenuContext>
          </FloatingList>
        </FloatingPortal>
      )}
    </>
  );
};
