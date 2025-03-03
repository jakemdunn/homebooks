import { style } from "@vanilla-extract/css";
import { actionsHeight } from "../../pages/Homepage.css";
import { globalTheme } from "../../pages/global.css";

export const tabsWrapperStyle = style({
  height: "100vh",
  overflowY: "auto",
  overflowX: "hidden",
  position: "sticky",
  top: 0,
  paddingBottom: "3rem",
  boxSizing: "border-box",
});

export const tabsActionsStyle = style({
  position: "sticky",
  top: 0,
  left: 0,
  height: actionsHeight,
  padding: "0 1rem",
  background: `color-mix(in srgb, ${globalTheme.colors.background.base} 80%, transparent)`,
  backdropFilter: "blur(5px)",
  zIndex: 100,
  display: "flex",
  justifyContent: "flex-end",
  gap: 2,
  alignItems: "center",
});
