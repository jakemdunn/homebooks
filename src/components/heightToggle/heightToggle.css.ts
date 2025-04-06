import { style } from "@vanilla-extract/css";

export const wrapperStyle = style({
  position: "relative",
  overflow: "hidden",
  selectors: {
    "&.transitioning": {
      transition: "height 0.2s ease-in-out",
    },
  },
});

export const contentStyle = style({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  selectors: {
    ".hidden &": {
      pointerEvents: "none",
    },
  },
});
