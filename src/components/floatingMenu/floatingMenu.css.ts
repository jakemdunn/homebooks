import { globalStyle, style } from "@vanilla-extract/css";
import { globalTheme } from "../../pages/global.css";

export const buttonStyle = style({
  position: "relative",
  overflow: "hidden",
  selectors: {
    "&:before, &:after": {
      content: " ",
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 0,
      transition: "all 0.2s ease-in-out",
      // TODO: Try circular path reveal, could be fun
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
    },
    "&:after": {
      zIndex: 1,
    },
    "&.mounted": {
      color: globalTheme.colors.text.inverse,
    },
    "&.mounted[class*='top']": {
      borderTopRightRadius: 0,
      borderTopLeftRadius: 0,
    },
    "&.mounted[class*='bottom']": {
      borderBottomRightRadius: 0,
      borderBottomLeftRadius: 0,
    },
    "&.mounted:before": {
      background: globalTheme.colors.background.inverse,
    },
    "&.mounted:hover:before": {
      background: `color-mix(in srgb, ${globalTheme.colors.background.level1} 10%, ${globalTheme.colors.background.inverse})`,
    },
    "&:hover:after, &.mounted:after": {
      background: globalTheme.colors.background.inverse,
    },
    "&.open[class*='top']:after": {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
    },
    "&.open[class*='bottom']:after": {
      clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)",
    },
  },
});

export const buttonContentsStyle = style({
  position: "relative",
  zIndex: 3,
  display: "flex",
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
});

export const menuStyle = style({
  vars: {
    floatingMenuButtonWidth: "2rem",
  },
  color: globalTheme.colors.text.inverse,
  background: `color-mix(in srgb, ${globalTheme.colors.background.inverse}, transparent 10%)`,
  backdropFilter: "blur(5px)",
  zIndex: 300,
  margin: 0,
  padding: `0.5rem`,
  listStyle: "none",
  fontSize: "0.8rem",
  position: "relative",
  overflow: "hidden",
  boxShadow: "0 0 4px rgba(0,0,0,0.4)",
  display: "flex",
  flexDirection: "column",
  borderRadius: 4,
  selectors: {
    "&[class*='top']": {
      borderBottomRightRadius: 0,
      background: `linear-gradient(to top, color-mix(in srgb, ${
        globalTheme.colors.background.inverse
      }, transparent 4%), color-mix(in srgb, ${
        globalTheme.colors.background.inverse
      }, transparent 10%) 5rem)`,
    },
    "&[class*='bottom']": {
      borderTopRightRadius: 0,
      background: `linear-gradient(to bottom, color-mix(in srgb, ${
        globalTheme.colors.background.inverse
      }, transparent 4%), color-mix(in srgb, ${
        globalTheme.colors.background.inverse
      }, transparent 10%) 5rem)`,
    },
    "&.contextualMenu[class*='top'], &.contextualMenu[class*='bottom']": {
      borderBottomRightRadius: 4,
      borderTopRightRadius: 4,
    },
  },
});

globalStyle(`${menuStyle}>hr`, {
  border: "none",
  borderBottom: `1px solid ${globalTheme.colors.background.level1}`,
  opacity: 0.2,
  width: "100%",
});
globalStyle(`${menuStyle}>hr:last-child, ${menuStyle}>hr:first-child`, {
  display: "none",
});

export const menuItem = style({
  padding: "0.25rem 0.25rem",
  cursor: "pointer",
  background: "none",
  border: "none",
  position: "relative",
  zIndex: 2,
  textAlign: "left",
  lineHeight: "1rem",
  maxWidth: "30ch",
  opacity: 0.75,
  transition: "all 0.1s ease-in-out",
  borderRadius: 2,
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "center",
  ":hover": {
    background: `color-mix(in srgb, ${globalTheme.colors.text.highContrast} 40%, ${globalTheme.colors.background.inverse})`,
    opacity: 1,
  },
  ":active": {
    background: globalTheme.colors.background.action,
  },
  ":focus": {
    background: globalTheme.colors.background.action,
    outline: "none",
  },
});
export const menuItemIcon = style({
  verticalAlign: "middle",
  marginRight: "0.5rem",
  width: "1rem",
  height: "1rem",
  maxHeight: "100%",
  display: "block",
});

export const menuNote = style({
  maxWidth: "calc(30ch + 0.5rem)",
  padding: "0.5rem .75rem",
  margin: "-0.5rem",
  fontSize: 12,
  lineHeight: "1.3em",
  background: "rgba(0,0,0,.2)",
  selectors: {
    "[class*='top'] &": {
      order: -1,
      borderRadius: "4px 4px 0 0",
      marginBottom: "0.5rem",
    },
    "[class*='bottom'] &": {
      borderRadius: "0 0 4px 4px",
      marginTop: "0.5rem",
    },
    ".contextualMenu &": {
      display: "none",
    },
  },
});

globalStyle(`${menuNote} p`, {
  margin: "0.15rem 0 0",
  textAlign: "right",
});
globalStyle(`${menuNote} a`, {
  color: globalTheme.colors.text.inverse,
  textDecoration: "underline",
  fontWeight: 500,
  cursor: "pointer",
});
globalStyle(`${menuNote} a:hover`, {
  color: globalTheme.colors.text.action,
});
