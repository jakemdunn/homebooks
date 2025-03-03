import { style } from "@vanilla-extract/css";

export const bookmarkWrapperStyle = style({
  position: "relative",
  zIndex: 0,
  padding: "0.25rem",
  transition: "z-index 0.2s ease-in-out",
  ":hover": {
    zIndex: 90,
  },
});
