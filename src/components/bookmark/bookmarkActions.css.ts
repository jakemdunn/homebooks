import { createVar, globalStyle, style } from "@vanilla-extract/css";
import { fonts, globalTheme } from "../../pages/global.css";

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
  padding: "0 0.25rem",
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

export const searchInputLabelStyle = style({
  display: "flex",
  gap: "0.35rem",
  marginRight: "2rem",
  alignItems: "center",
  flex: "1 0 0",
  fontSize: "1.25rem",
  fontWeight: fonts.nunito.weights[700],
  fontFamily: fonts.nunito.styles.fontFamily,
  color: globalTheme.colors.text.header,
  borderBottom: "2px solid transparent",
  borderTop: "2px solid transparent",
  selectors: {
    "&:has(input:focus)": {
      borderBottom: "2px solid",
    },
  },
});

export const searchInputStyle = style({
  fontSize: "1.25rem",
  fontWeight: fonts.nunito.weights[700],
  fontFamily: fonts.nunito.styles.fontFamily,
  color: globalTheme.colors.text.header,
  flex: "1 0 0",
  border: "none",
  borderRadius: 0,
  lineHeight: 1,
  padding: 0,
  background: "none",
  selectors: {
    "&:focus": {
      outline: "none",
    },
  },
});

export const searchInputClearButtonStyle = style({
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
  color: globalTheme.colors.text.header,
  fontSize: "1.5rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});
