import { style } from "@vanilla-extract/css";

export const bookmarkEditRowStyle = style({
  gridColumn: "1 / -1",
  width: "100%",
  display: "flex",
  flexDirection: "column",
  gap: "0.35rem",
  padding: "0.25rem",
  boxSizing: "border-box",
});

export const bookmarkEditInputStyle = style({
  width: "100%",
  boxSizing: "border-box",
  padding: "0.25rem 0.35rem",
});

export const bookmarkWrapperStyle = style({
  position: "relative",
  zIndex: 0,
  flex: "1 0 0",
  padding: "0.25rem",
  transition: "z-index 0.2s ease-in-out",
  ":hover": {
    zIndex: 90,
  },
});
