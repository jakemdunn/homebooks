import { style } from "@vanilla-extract/css";
import { fonts, globalTheme } from "../../pages/global.css";

export const formStyle = style({
  ...fonts.rubik.styles,
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
  minWidth: 0,
});

export const fieldGroupStyle = style({
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
});

export const labelStyle = style({
  fontSize: "0.85rem",
  fontWeight: fonts.rubik.weights[400],
  color: globalTheme.colors.text.default,
});

export const inputStyle = style({
  width: "100%",
  boxSizing: "border-box",
  padding: "0.35rem 0.5rem",
  border: `1px solid color-mix(in srgb, ${globalTheme.colors.text.default} 35%, transparent)`,
  borderRadius: 4,
  background: globalTheme.colors.background.level1,
  color: globalTheme.colors.text.default,
});

export const fieldErrorStyle = style({
  fontSize: "0.8rem",
  color: "#e57373",
});

export const globalErrorStyle = style({
  fontSize: "0.85rem",
  color: "#e57373",
  margin: 0,
  padding: "0.5rem",
  background: "color-mix(in srgb, #e57373 15%, transparent)",
  borderRadius: 4,
});

export const folderSelectWrapStyle = style({
  maxHeight: "12rem",
  overflow: "auto",
  border: `1px solid color-mix(in srgb, ${globalTheme.colors.text.default} 25%, transparent)`,
  borderRadius: 4,
  padding: "0.25rem",
});

export const actionsStyle = style({
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem",
  marginTop: "0.25rem",
});

export const buttonPrimaryStyle = style({
  padding: "0.4rem 0.85rem",
  borderRadius: 4,
  border: "none",
  cursor: "pointer",
  background: globalTheme.colors.background.action,
  color: globalTheme.colors.text.inverse,
  fontWeight: fonts.rubik.weights[400],
});

export const buttonSecondaryStyle = style({
  padding: "0.4rem 0.85rem",
  borderRadius: 4,
  border: `1px solid color-mix(in srgb, ${globalTheme.colors.text.default} 40%, transparent)`,
  cursor: "pointer",
  background: "transparent",
  color: globalTheme.colors.text.default,
});
