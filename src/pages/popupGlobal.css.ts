import { globalStyle } from "@vanilla-extract/css";
import { fonts, globalTheme } from "./global.css";

/**
 * Popup documents must size to their content. Do not use height: 100vh or
 * overflow: hidden on html/body here — that collapses toolbar popups to ~0 height.
 */
globalStyle("html, body", {
  ...fonts.nunito.styles,
  fontWeight: fonts.nunito.weights[400],
  margin: 0,
  padding: 0,
  backgroundColor: globalTheme.colors.background.base,
  color: globalTheme.colors.text.default,
  width: "100%",
  height: "auto",
  minHeight: "min-content",
  overflowX: "hidden",
  overflowY: "auto",
});

globalStyle("body", {
  display: "block",
});
