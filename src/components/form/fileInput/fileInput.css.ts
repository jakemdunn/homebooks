import { style } from "@vanilla-extract/css";
import { globalTheme } from "../../../pages/global.css";

export const fileInputWrapper = style({
  position: "relative",
  display: "inline-block",
  width: "100%",
  verticalAlign: "middle",
});

export const fileInputFace = style({
  background: `color-mix(in srgb, ${globalTheme.colors.background.button} 20%, transparent)`,
  borderRadius: 4,
  padding: "0.35rem 0.75rem",
  color: "inherit",
  display: "inline-block",
  transition: "all 0.1s ease-in-out",
  pointerEvents: "none",
  userSelect: "none",
  width: "100%",
  boxSizing: "border-box",
  textAlign: "center",
  overflow: "hidden",
  position: "relative",
  selectors: {
    [`${fileInputWrapper}:hover &`]: {
      background: `color-mix(in srgb, ${globalTheme.colors.background.button} 60%, transparent)`,
    },
  },
});

export const fileInputProgress = style({
  position: "absolute",
  bottom: 0,
  left: 0,
  width: "100%",
  top: 0,
  zIndex: -1,
  background: `color-mix(in srgb, ${globalTheme.colors.background.button} 60%, transparent)`,
  transition: "width 0.05s ease-in-out",
});

export const fileInputNative = style({
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  margin: 0,
  padding: 0,
  opacity: 0,
  cursor: "pointer",
  fontSize: 0,
});
