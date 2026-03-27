import { createVar, globalStyle, style } from "@vanilla-extract/css";
import { fonts, globalTheme } from "./global.css";

export const homepageStyle = style({
  padding: "0 0 0 3rem",
  overflowY: "scroll",
  overflowX: "hidden",
  height: "100vh",
  "@supports": {
    "((scrollbar-gutter: stable) and (scrollbar-width: auto))": {
      scrollbarWidth: "thin",
      scrollbarGutter: "stable",
    },
    "(scrollbar-color: lime hotpink)": {
      scrollbarColor: `color-mix(in srgb, ${globalTheme.colors.background.action} 70%, transparent) transparent`,
    },
  },
});

export const actionsHeight = createVar();

globalStyle(":root", {
  vars: {
    [actionsHeight]: "3rem",
  },
});

export const actionsStyle = style({
  position: "sticky",
  top: 0,
  left: 0,
  height: actionsHeight,
  padding: "0",
  background: `color-mix(in srgb, ${globalTheme.colors.background.base} 20%, transparent)`,
  backdropFilter: "blur(5px)",
  zIndex: 100,
  display: "flex",
  justifyContent: "flex-end",
  gap: "1rem",
  alignItems: "center",
  viewTransitionName: "bookmark-actions",
});
globalStyle("::view-transition-group(bookmark-actions)", {
  zIndex: 100,
});

export const actionButtonStyle = style({
  fontWeight: fonts.nunito.weights[700],
  background: "none",
  color: globalTheme.colors.text.action,
  border: "none",
  padding: "0",
  zIndex: 100,
  cursor: "pointer",
  transition: "all 0.2s ease-in-out",
  display: "flex",
  alignItems: "center",
  gap: "0.15rem",
  ":hover": {
    color: globalTheme.colors.text.highContrast,
  },
});

export const contentStyle = style({
  display: "flex",
  gap: "1rem",
  padding: "0 1rem",
});
