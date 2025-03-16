import { style } from "@vanilla-extract/css";
import { globalTheme } from "../../../pages/global.css";

export const optionsStyle = style({
  border: `1px solid ${globalTheme.colors.background.action}`,
  display: "flex",
  flexDirection: "column",
  borderRadius: 4,
  maxHeight: "60vh",
  overflow: "auto",
  padding: "0.25rem",
});

export const optionGroupStyle = style({
  display: "flex",
  alignItems: "center",
  borderRadius: 2,
  padding: "2px 0",
  ":hover": {
    background: `color-mix(in srgb, ${globalTheme.colors.background.button} 20%, transparent)`,
  },
  selectors: {
    "&.selected": {
      background: globalTheme.colors.background.button,
      color: globalTheme.colors.text.highContrast,
    },
  },
});
export const optionExpandStyle = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "1rem",
  height: "0.5rem",
  cursor: "pointer",
  marginLeft: "-1rem",
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
  padding: 0,
  flex: 1,
  textAlign: "left",
  cursor: "pointer",
});
