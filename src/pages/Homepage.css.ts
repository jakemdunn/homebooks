import { style } from "@vanilla-extract/css";
import { globalTheme } from "./global.css";

export const homepageStyle = style({
  padding: "0 0 0 3rem",
  overflowY: "scroll",
  overflowX: "hidden",
  height: "100vh",
  "@supports": {
    "((scrollbar-gutter: stable) and (scrollbar-width: auto))": {
      scrollbarWidth: "thin",
      scrollbarGutter: "stable",
    },
    "(scrollbar-color: lime hotpink)": {
      scrollbarColor: `color-mix(in srgb, ${globalTheme.colors.background.action} 70%, transparent) transparent`,
    },
  },
});

export const contentStyle = style({
  display: "flex",
  gap: "1rem",
  padding: "0 1rem",
});
