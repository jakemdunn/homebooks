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
  color: globalTheme.colors.text.inverse,
  background: globalTheme.colors.background.inverse,
  zIndex: 90,
  margin: 0,
  padding: `0.5rem 0`,
  listStyle: "none",
  fontSize: "0.8rem",
  position: "relative",
  overflow: "hidden",
  boxShadow: "0 0 4px rgba(0,0,0,0.4)",
  display: "flex",
  flexDirection: "column",
  selectors: {
    "&[class*='top']": {
      borderRadius: "4px 4px 0 0",
    },
    "&[class*='bottom']": {
      borderRadius: "0 0 4px 4px",
    },
  },
});

globalStyle(`${menuStyle}>hr`, {
  border: `1px solid ${globalTheme.colors.background.level1}`,
  width: "calc(100% - 1.5rem)",
});
globalStyle(`${menuStyle}>hr:last-child, ${menuStyle}>hr:first-child`, {
  display: "none",
});

export const menuItem = style({
  padding: "0.25rem 0.75rem",
  cursor: "pointer",
  background: globalTheme.colors.background.inverse,
  border: "none",
  position: "relative",
  zIndex: 2,
  textAlign: "left",
  maxWidth: "30ch",
  ":hover": {
    background: `color-mix(in srgb, ${globalTheme.colors.background.level1} 10%, ${globalTheme.colors.background.inverse})`,
  },
});

export const menuNote = style({
  maxWidth: "30ch",
  padding: "0.5rem 0.75rem",
  fontSize: 12,
  lineHeight: "1.3em",
  background: globalTheme.colors.background.action,
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
  },
});
