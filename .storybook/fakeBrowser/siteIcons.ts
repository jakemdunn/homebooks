/** A Site Icon built in, so no story fetches one: a coloured tile with a mark. */
const icon = (background: string, mark: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">` +
      `<rect width="32" height="32" rx="8" fill="${background}"/>` +
      `<g fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${mark}</g>` +
      `</svg>`,
  )}`;

export const SITE_ICONS = {
  circle: icon("#ae2012", `<circle cx="16" cy="16" r="7"/>`),
  square: icon("#005f73", `<rect x="9" y="9" width="14" height="14" rx="2"/>`),
  triangle: icon("#ca6702", `<path d="M16 8 24 23H8Z"/>`),
  wave: icon("#0a9396", `<path d="M6 18q5-8 10 0t10 0"/>`),
  bars: icon("#3a0ca3", `<path d="M10 22V14M16 22V9M22 22v-5"/>`),
  check: icon("#2b9348", `<path d="m9 16 5 5 9-10"/>`),
  /** An image that never loads, as a cached icon can stop loading. */
  broken: "data:image/png;base64,bm90IGFuIGltYWdl",
} as const;
