import { style } from "@vanilla-extract/css";
import { globalTheme } from "./global.css";

export const popupRootStyle = style({
  padding: "12px",
  minWidth: "320px",
  maxWidth: "380px",
  boxSizing: "border-box",
  background: globalTheme.colors.background.base,
  minHeight: "min-content",
});

/** Keeps the popup from collapsing to zero height while async data loads. */
export const popupLoadingRootStyle = style({
  padding: "12px",
  minWidth: "320px",
  maxWidth: "380px",
  minHeight: "12rem",
  boxSizing: "border-box",
  background: globalTheme.colors.background.base,
  color: globalTheme.colors.text.default,
  fontSize: "0.9rem",
});

export const popupHeadingStyle = style({
  margin: "0 0 0.75rem",
  fontSize: "1.1rem",
  color: globalTheme.colors.text.header,
});

export const popupBodyStyle = style({
  margin: "0 0 1rem",
  fontSize: "0.85rem",
  lineHeight: 1.45,
  color: globalTheme.colors.text.default,
});

export const popupVersionRowStyle = style({
  margin: "0 0 1rem",
  fontSize: "0.85rem",
  color: globalTheme.colors.text.highContrast,
});

export const popupAboutBlockStyle = style({
  margin: "0 0 1rem",
  paddingTop: "0.75rem",
  borderTop: `1px solid color-mix(in srgb, ${globalTheme.colors.text.default} 25%, transparent)`,
});

export const popupAboutHeadingStyle = style({
  margin: "0 0 0.35rem",
  fontSize: "0.8rem",
  fontWeight: "600",
  color: globalTheme.colors.text.header,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
});

export const popupAboutTextStyle = style({
  margin: 0,
  fontSize: "0.8rem",
  lineHeight: 1.45,
  color: globalTheme.colors.text.default,
});

export const popupSettingsButtonStyle = style({
  width: "100%",
  marginTop: "0.25rem",
});
