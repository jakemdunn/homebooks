import { style } from "@vanilla-extract/css";

export const bookmarksWrapperStyle = style({
  padding: "0 0 3rem",
  flex: "1 0 0",
});
export const bookmarksStyle = style({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(25ch, 1fr))",
});
