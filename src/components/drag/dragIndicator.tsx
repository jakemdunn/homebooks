import { FC } from "react";
import { useDragSelector } from "./dragContext";
import { indicatorStyle } from "./dragProvider.css";

const NO_MARKER = {};

/**
 * Marks the Drop Position on the Drop Destination. The only component that
 * re-renders as the pointer moves between Drop Destinations.
 */
export const DragIndicator: FC = () => {
  const style = useDragSelector((state) => state.indicator) ?? NO_MARKER;
  return <div aria-hidden="true" className={indicatorStyle} style={style} />;
};
DragIndicator.displayName = "DragIndicator";
