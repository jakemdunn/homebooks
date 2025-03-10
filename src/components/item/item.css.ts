import { style } from "@vanilla-extract/css";
import { globalTheme } from "../../pages/global.css";

export const itemWrapperStyle = style({
  position: "relative",
  zIndex: 0,
  padding: "0.25rem",
  transition: "z-index 0.2s ease-in-out",
  display: "flex",
  flex: "1 1 0",
  ":hover": {
    zIndex: 90,
  },
  selectors: {
    "&.dragging": {
      filter: "blur(1px)",
      transform: "scale(0.98)",
      opacity: 0.7,
      pointerEvents: "none",
    },
  },
});

export const itemStyle = style({
  background: globalTheme.colors.background.button,
  borderRadius: "2px 0 0 2px",
  display: "flex",
  height: "3rem",
  justifyContent: "center",
  alignItems: "center",
  color: globalTheme.colors.text.highContrast,
  textDecoration: "none",
  transition: "all 0.2s ease-in-out",
  flex: "1 1 0",
  overflow: "hidden",
  flexDirection: "column",
  cursor: "pointer",
  border: "none",
  width: "100%",
  padding: 0,
  textAlign: "left",
  ":last-child": {
    borderRadius: 2,
  },
});

export const itemActionsStyle = style({
  border: "none",
  borderRadius: "0 2px 2px 0",
  background: `color-mix(in srgb, ${globalTheme.colors.background.level1} 10%, ${globalTheme.colors.background.button})`,
  color: globalTheme.colors.text.highContrast,
  fontSize: "1rem",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  cursor: "pointer",
  transition: "all 0.2s ease-in-out",
  flex: "0 0 auto",
  height: "100%",
  ":hover": {
    color: globalTheme.colors.text.inverse,
  },
});

export const itemContent = style({
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "center",
  padding: "0 0.75rem",
  flex: "1 1 0",
  width: "100%",
  boxSizing: "border-box",
});

export const itemImageStyle = style({
  position: "absolute",
  left: "0.75rem",
  top: "50%",
  marginTop: -16,
});

export const itemTitleStyle = style({
  display: "-webkit-box",
  overflow: "hidden",
  textOverflow: "ellipsis",
  lineClamp: 2,
  whiteSpace: "initial",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
  maxLines: 2,
  lineHeight: "1.2em",
  fontSize: 14,
  fontWeight: 600,
  flex: "1 1 0",
  margin: "0 0 0 calc(32px + 0.75rem)",
  transition: "all 0.2s ease-in-out",
  selectors: {
    [`${itemStyle}:hover &`]: {
      fontSize: 12,
    },
  },
});

export const itemDetailsStyle = style({
  flex: "0 0 0",
  width: "100%",
  transition: "all 0.2s ease-in-out",
  background: globalTheme.colors.background.inverse,
  color: globalTheme.colors.text.inverse,
  fontSize: 12,
  lineHeight: "1.2em",
  overflow: "hidden",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
  padding: "0 0.75rem 0 calc(32px + 1.5rem)",
  textAlign: "right",
  boxSizing: "border-box",
  borderRadius: "0 0 0 2px",
  selectors: {
    [`${itemStyle}:hover &`]: {
      flex: "0 0 1.2em",
    },
    [`${itemStyle}:last-child &`]: {
      borderRadius: "0 0 2px 2px",
    },
  },
});
