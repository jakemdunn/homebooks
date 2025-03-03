import { createVar, style } from "@vanilla-extract/css";
import { globalTheme } from "../../pages/global.css";

const folderHeadingSize = createVar();
export const folderStyle = style({
  vars: {
    [folderHeadingSize]: "3rem",
  },
  padding: "0.25rem",
  position: "relative",
  transition: "all 0.2s ease-in-out",
  height: "3rem",
  selectors: {
    "&.expanded": {
      gridColumnStart: 1,
      gridColumnEnd: -1,
      height: "auto",
    },
    "&.dragging": {
      filter: "blur(1px)",
      transform: "scale(0.98)",
      opacity: 0.7,
      pointerEvents: "none",
    },
  },
});

export const folderHeaderWrapperStyles = style({
  cursor: "pointer",
  position: "relative",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: `0 1rem`,
  zIndex: 80,
});

export const folderContentStyle = style({
  background: globalTheme.colors.background.level1,
  position: "absolute",
  zIndex: 0,
  top: "0.25rem",
  right: "0.25rem",
  bottom: "0.25rem",
  left: "0.25rem",
  transition: "background 0.2s ease-in-out",
  selectors: {
    [`${folderHeaderWrapperStyles}:hover + &`]: {
      background: `color-mix(in srgb, ${globalTheme.colors.background.level1} 60%, ${globalTheme.colors.background.button})`,
    },
  },
});
export const folderContentWrapperStyle = style({
  background: globalTheme.colors.background.base,
  margin: "0 0.25rem 0.25rem",
  padding: "0.25rem",
  position: "relative",
  zIndex: 2,
  selectors: {
    [`${folderStyle} > &`]: {
      height: 0,
      margin: "0 0.25rem 0",
      padding: "0 0.25rem",
      overflow: "hidden",
    },
    [`${folderStyle}.expanded > &`]: {
      height: "auto",
      margin: "0 0.25rem 0.25rem",
      padding: "0.25rem",
    },
  },
});

export const folderHeadingStyle = style({
  margin: 0,
  padding: 0,
  cursor: "pointer",
  height: folderHeadingSize,
  display: "inline-flex",
  alignItems: "flex-start",
  justifyContent: "center",
  flexDirection: "column",
  lineHeight: "1em",
  fontWeight: 800,
  gap: "0.2rem",
});
export const folderSubHeadingStyle = style({
  fontSize: 10,
  lineHeight: "1em",
  opacity: 0.6,
  fontWeight: 400,
});

export const folderIndicatorStyle = style({
  ":after": {
    content: " ",
    borderBottom: "4px solid",
    borderRight: "4px solid",
    width: "0.5rem",
    height: "0.5rem",
    display: "block",
    transform: "translateY(0.15rem) rotate(-135deg)",
    transition: "all 0.2s ease-in-out",
  },
  selectors: {
    ".expanded &:after": {
      transform: "translateY(-0.15rem) rotate(45deg)",
    },
  },
});
