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
  padding: "0 1rem",
  background: `color-mix(in srgb, ${globalTheme.colors.background.base} 20%, transparent)`,
  backdropFilter: "blur(5px)",
  zIndex: 100,
  display: "flex",
  justifyContent: "flex-end",
  gap: 2,
  alignItems: "center",
});

export const actionButtonStyle = style({
  fontWeight: fonts.nunito.weights[700],
  background: globalTheme.colors.background.button,
  color: globalTheme.colors.text.inverse,
  border: "none",
  padding: "0.25rem 0.5rem",
  borderRadius: "4px 0 0 4px",
  zIndex: 100,
  cursor: "pointer",
  transition: "all 0.2s ease-in-out",
  ":hover": {
    background: globalTheme.colors.text.header,
    color: globalTheme.colors.text.highContrast,
  },
  ":last-child": {
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  selectors: {
    [`&+&`]: {
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
    },
  },
});

export const contentStyle = style({
  display: "flex",
  gap: "1rem",
  padding: "0 1rem",
});
