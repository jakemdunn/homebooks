import { createVar, globalStyle, style } from "@vanilla-extract/css";
import { fonts, globalTheme } from "./global.css";

export const homepageStyle = style({
  padding: "0 0 0 3rem",
  overflow: "auto",
  height: "100vh",
});

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
  gap: ".5rem",
  boxSizing: "border-box",
});

export const headerIconStyle = style({
  width: "1.4rem",
  height: "auto",
  transform: "rotate(-90deg) translateX(1px)",
});

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
  padding: "0 1rem",
  background: `color-mix(in srgb, ${globalTheme.colors.background.base} 20%, transparent)`,
  backdropFilter: "blur(5px)",
  zIndex: 100,
  display: "flex",
  justifyContent: "flex-end",
  gap: 2,
  alignItems: "center",
});

export const actionButtonStyle = style({
  fontWeight: fonts.nunito.weights[700],
  background: globalTheme.colors.background.button,
  color: globalTheme.colors.text.inverse,
  border: "none",
  padding: "0.25rem 0.5rem",
  borderRadius: "4px 0 0 4px",
  zIndex: 100,
  cursor: "pointer",
  transition: "all 0.2s ease-in-out",
  ":hover": {
    background: globalTheme.colors.text.header,
    color: globalTheme.colors.text.highContrast,
  },
  ":last-child": {
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  selectors: {
    [`&+&`]: {
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
    },
  },
});

export const contentStyle = style({
  display: "grid",
  gridTemplateColumns: "1fr max(35ch, 30vw)",
  gap: "1rem",
  padding: "0 1rem",
});
