import { style } from "@vanilla-extract/css";
import { globalTheme } from "../../pages/global.css";

export const indicatorStyle = style({
  position: "absolute",
  pointerEvents: "none",
  border: `2px solid ${globalTheme.colors.text.header}`,
  borderRadius: 4,
  zIndex: 500,
  left: -999,
});
