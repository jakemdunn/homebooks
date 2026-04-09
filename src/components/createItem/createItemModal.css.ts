import { style } from "@vanilla-extract/css";
import { fonts, globalTheme } from "../../pages/global.css";

export const overlayStyle = style({
  position: "fixed",
  inset: 0,
  zIndex: 10000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1rem",
  background: "rgba(0, 0, 0, 0.55)",
  backdropFilter: "blur(4px)",
});

export const dialogStyle = style({
  ...fonts.rubik.styles,
  width: "min(28rem, 100%)",
  maxHeight: "min(90vh, 32rem)",
  overflow: "auto",
  padding: "1.25rem",
  borderRadius: 8,
  boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
  background: globalTheme.colors.background.level1,
  color: globalTheme.colors.text.default,
  boxSizing: "border-box",
});

export const titleStyle = style({
  margin: "0 0 1rem",
  fontSize: "1.25rem",
  fontWeight: fonts.rubik.weights[400],
  color: globalTheme.colors.text.header,
});
