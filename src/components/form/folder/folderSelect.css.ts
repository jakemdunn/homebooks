import { style } from "@vanilla-extract/css";
import { globalTheme } from "../../../pages/global.css";

export const optionsStyle = style({
  border: `1px solid color-mix(in srgb, ${globalTheme.colors.background.action} 50%, transparent)`,
  display: "flex",
  flexDirection: "column",
  borderRadius: 4,
  maxHeight: "calc(100vh - 15rem)",
  minHeight: "5rem",
  overflowY: "auto",
  padding: "0.25rem",
  transition: "border 0.2s ease-in-out",
  "@supports": {
    "((scrollbar-gutter: stable) and (scrollbar-width: auto))": {
      scrollbarWidth: "thin",
    },
    "(scrollbar-color: lime hotpink)": {
      scrollbarColor: `color-mix(in srgb, ${globalTheme.colors.background.action} 70%, transparent) transparent`,
    },
  },
  selectors: {
    "&:hover, &:focus-within": {
      border: `1px solid color-mix(in srgb, ${globalTheme.colors.background.action} 90%, transparent)`,
    },
  },
});

export const optionGroupStyle = style({
  display: "flex",
  alignItems: "center",
  position: "relative",
});
export const optionExpandStyle = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "1rem",
  height: "100%",
  position: "absolute",
  left: 0,
  top: 0,
  cursor: "pointer",
  margin: "0",
  background: "none",
  border: "none",
  padding: "0",
  color: "inherit",
  ":after": {
    content: " ",
    transform: "rotate(45deg)",
    transition: "all 0.2s ease-in-out",
    borderTop: `3px solid`,
    borderRight: `3px solid`,
    width: "0.25rem",
    height: "0.25rem",
    display: "block",
  },
  selectors: {
    ".selected &": {
      color: globalTheme.colors.text.highContrast,
    },
    "&.expanded:after": {
      transform: "rotate(135deg)",
    },
  },
});

export const optionStyle = style({
  border: "none",
  background: "none",
  color: "inherit",
  margin: 0,
  flex: 1,
  textAlign: "left",
  cursor: "pointer",
  borderRadius: 2,
  padding: "2px 0",
  ":hover": {
    background: `color-mix(in srgb, ${globalTheme.colors.background.button} 60%, transparent)`,
  },
  selectors: {
    ".selectedInside &": {
      background: `color-mix(in srgb, ${globalTheme.colors.background.button} 30%, transparent)`,
    },
    ".selectedInside &:hover": {
      background: `color-mix(in srgb, ${globalTheme.colors.background.button} 60%, transparent)`,
    },
    ".selected &": {
      background: globalTheme.colors.background.button,
      color: globalTheme.colors.text.highContrast,
    },
  },
});
