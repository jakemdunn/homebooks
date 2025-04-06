import { globalStyle, style } from "@vanilla-extract/css";
import { fonts, globalTheme } from "../../pages/global.css";

export const headerStyle = style({
  ...fonts.rubik.styles,
  fontWeight: fonts.rubik.weights[400],
  fontSize: "2rem",
  color: globalTheme.colors.text.header,
  display: "flex",
  alignItems: "center",
  width: "100vh",
  margin: 0,
  padding: "0 1rem",
  minHeight: "3rem",
  lineHeight: "3rem",
  background: `repeating-linear-gradient( 45deg, ${globalTheme.colors.background.level1}, ${globalTheme.colors.background.level1} 5px, rgba(0,0,0,0) 5px, rgba(0,0,0,0) 10px )`,
  transform: "rotate(90deg) translateY(-3rem)",
  transformOrigin: "0 0",
  position: "fixed",
  top: 0,
  left: 0,
  gap: ".1rem",
  boxSizing: "border-box",
});

export const headerIconStyle = style({
  width: "1.4rem",
  height: "auto",
  transform: "rotate(-90deg) translateX(1px)",
});

export const settingsButtonStyle = style({
  margin: "0 0 0 auto",
  padding: 0,
  border: "none",
  background: "none",
  fontSize: "2rem",
  color: globalTheme.colors.text.header,
  height: "3rem",
  width: "3rem",
  cursor: "pointer",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  transition: "all 0.2s ease-in-out",
  ":hover": {
    background: globalTheme.colors.text.header,
    color: globalTheme.colors.text.inverse,
  },
});

export const settingsPanelStyle = style({
  position: "fixed",
  top: 0,
  left: "3rem",
  zIndex: 200,
  height: "100vh",
  width: 0,
  minWidth: 0,
  maxWidth: 0,
  overflow: "hidden",
  background: `color-mix(in srgb, ${globalTheme.colors.background.level1} 90%, transparent)`,
  boxShadow: "5px 0 10px rgba(0,0,0,0.4)",
  transition: "all 0.2s ease-in-out, height 0s",
  backdropFilter: "blur(5px)",
  perspective: 800,
  perspectiveOrigin: "100% 50%",
  selectors: {
    "&.open": {
      width: "20vw",
      minWidth: "30ch",
      maxWidth: "calc(100vw - 4rem)",
    },
  },
});

globalStyle(`${settingsPanelStyle} + *`, {
  transformOrigin: "100% 0%",
  transition: "all 0.2s ease-in-out",
});
globalStyle(`${settingsPanelStyle}.open + *`, {
  opacity: 0.3,
  transform: "translateX(10rem)",
  pointerEvents: "none",
});

export const settingsContentStyle = style({
  width: "20vw",
  minWidth: "30ch",
  maxWidth: "calc(100vw - 4rem)",
  padding: "1rem 1.5rem",
  boxSizing: "border-box",
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  overflow: "auto",
  transition: "transform 0.2s ease-in-out",
  transformOrigin: "100% 50%",
  transform: "rotateY(-70deg)",
  display: "flex",
  flexDirection: "column",
  "@supports": {
    "((scrollbar-gutter: stable) and (scrollbar-width: auto))": {
      scrollbarWidth: "thin",
    },
    "(scrollbar-color: lime hotpink)": {
      scrollbarColor: `color-mix(in srgb, ${globalTheme.colors.background.action} 70%, transparent) transparent`,
    },
  },
  selectors: {
    [".open>&"]: {
      transform: "rotateY(0deg)",
    },
  },
});

export const selectStyle = style({
  width: "100%",
  border: `1px solid color-mix(in srgb, ${globalTheme.colors.background.action} 50%, transparent)`,
  borderRadius: 4,
  background: "none",
  padding: "0.25rem 0.5rem",
  color: "inherit",
  transition: "all 0.2s ease-in-out",
  selectors: {
    "&:hover, &:focus": {
      border: `1px solid color-mix(in srgb, ${globalTheme.colors.background.action} 90%, transparent)`,
    },
  },
});

export const settingsHeaderStyle = style({
  ...fonts.nunito.styles,
  fontWeight: fonts.nunito.weights[200],
  fontSize: "1.25rem",
  textTransform: "uppercase",
  textAlign: "center",
  margin: "0 auto 0.5rem",
  letterSpacing: 2,
  padding: "0 2rem 0.5rem",
  borderBottom: `1px solid color-mix(in srgb, ${globalTheme.colors.text.default} 20%, transparent)`,
});

export const settingsFormStyle = style({
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  marginTop: "0.5rem",
});

globalStyle(`${settingsFormStyle} label`, {
  fontSize: 16,
  fontWeight: 400,
  margin: "0 0 0.15rem",
  display: "block",
});
