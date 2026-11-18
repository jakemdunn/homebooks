import nunito from "@fontsource-variable/nunito/files/nunito-latin-wght-normal.woff2?url";
import nunitoItalic from "@fontsource-variable/nunito/files/nunito-latin-wght-italic.woff2?url";
import rubikMonoOne from "@fontsource/rubik-mono-one/files/rubik-mono-one-latin-400-normal.woff2?url";

/**
 * The extension's Google Fonts (see src/homepage.html), bundled so no
 * story fetches them, under the family names its styles use.
 */
const FONTS = [
  new FontFace("Nunito", `url(${nunito})`, { weight: "200 1000" }),
  new FontFace("Nunito", `url(${nunitoItalic})`, {
    weight: "200 1000",
    style: "italic",
  }),
  new FontFace("Rubik Mono One", `url(${rubikMonoOne})`),
];

/** Adds the fonts and waits for them, so no story renders before they load. */
export const loadFonts = async () => {
  for (const font of FONTS) document.fonts.add(font);
  await Promise.all(FONTS.map((font) => font.load()));
};
