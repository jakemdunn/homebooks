import { createVar, style } from "@vanilla-extract/css";
import { globalTheme } from "../../pages/global.css";
import { actionsHeight } from "../bookmark/bookmarkActions.css";

export const tabsHeight = createVar();

export const tabsWrapperStyle = style({
  vars: {
    [tabsHeight]: "0px",
  },
  paddingBottom: "3rem",
  boxSizing: "border-box",
  flex: "0 0 35ch",
});

export const tabsContentStyle = style({
  position: "sticky",
  transition: "top 0.2s ease-in-out",
  top: `min(${actionsHeight}, calc(-1 * ${tabsHeight} + 100vh))`,
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
