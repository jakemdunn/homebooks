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
  selectors: {
    [`${fileInputWrapper}:hover &`]: {
      background: `color-mix(in srgb, ${globalTheme.colors.background.button} 60%, transparent)`,
    },
  },
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
