import { FC, useCallback, useEffect, useRef, useState } from "react";
import { useResizeDetector } from "react-resize-detector";
import { contentStyle, wrapperStyle } from "./heightToggle.css";
import { useConditionalClassNames } from "../../util/useConditionalClassNames";

export const HeightToggle: FC<
  { hidden: boolean } & React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  >
> = ({ hidden, ...props }) => {
  const { height, ref } = useResizeDetector();
  const [transitioning, setTransitioning] = useState(false);
  const wrapperClassNames = useConditionalClassNames(
    {
      hidden,
      transitioning,
    },
    wrapperStyle
  );
  const onTransitionEnd = useCallback(() => {
    console.log("transition end?");
    setTransitioning(false);
  }, []);

  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    wrapperRef.current?.classList.add("transitioning");
    setTransitioning(true);
  }, [hidden]);
  return (
    <div
      ref={wrapperRef}
      onTransitionEnd={onTransitionEnd}
      style={{ height: hidden ? 0 : height }}
      inert={hidden}
      className={wrapperClassNames}
    >
      <div className={contentStyle} ref={ref} {...props} />
    </div>
  );
};
