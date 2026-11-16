import { style } from "@vanilla-extract/css";
import { fonts, globalTheme } from "../../pages/global.css";

/** The size Site Icons are drawn at, in CSS pixels. */
export const ICON_SIZE = 32;

export const iconStyle = style({ display: "block" });

export const letterTileBackgroundStyle = style({
  fill: globalTheme.colors.background.level1,
});

export const letterTileLetterStyle = style({
  ...fonts.nunito.styles,
  fontWeight: fonts.nunito.weights[800],
  fill: globalTheme.colors.text.default,
});
