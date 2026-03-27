import { globalStyle, style } from "@vanilla-extract/css";
import { fonts, globalTheme } from "../../pages/global.css";

export const bookmarksWrapperStyle = style({
  padding: "0 0 3rem",
  flex: "1 0 0",
});
export const bookmarksStyle = style({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(25ch, 1fr))",
});
export const bookmarksEmptyStyle = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  maxWidth: "60ch",
  margin: "3rem auto",
  textAlign: "center",
  gap: ".5rem",
});
globalStyle(`${bookmarksEmptyStyle} h2`, {
  margin: `0 0 1rem`,
  padding: 0,
  fontSize: "2rem",
  fontWeight: fonts.nunito.weights[700],
  fontFamily: fonts.nunito.styles.fontFamily,
  color: globalTheme.colors.text.header,
  textTransform: "uppercase",
  borderBottom: "3px dashed",
});
globalStyle(`${bookmarksEmptyStyle} p`, {
  margin: 0,
});
export const bookmarksEmptyIconStyle = style({
  fontSize: "8rem",
  color: globalTheme.colors.background.level1,
});
export const bookmarksEmptyButtonStyle = style({
  marginTop: "2rem",
  maxWidth: "30ch",
});
