import type { DragId } from "./dragTypes";

export const DATA_TYPE_KEYS = {
  sources: "text/home-books-sources",
  urls: "text/x-moz-url",
  html: "text/html",
  plain: "text/plain",
} as const;

export type DataTransferTypes =
  | {
      type: "dragIds";
      data: DragId[];
    }
  | {
      type: "urls";
      data: { url: string; title: string }[];
    }
  | undefined;

export const parseDataTransfer = (
  dataTransfer: Pick<DataTransfer, "types" | "getData">,
): DataTransferTypes => {
  if (dataTransfer.types.includes(DATA_TYPE_KEYS.sources)) {
    const json = dataTransfer.getData(DATA_TYPE_KEYS.sources);
    try {
      return {
        type: "dragIds",
        data: JSON.parse(json) as DragId[],
      };
    } catch (error) {
      console.error(error);
    }
  }
  if (dataTransfer.types.includes(DATA_TYPE_KEYS.urls)) {
    const urls = dataTransfer.getData(DATA_TYPE_KEYS.urls);
    const pairs = urls.matchAll(/(.*)\n(.*)\n?/gm);
    return {
      type: "urls",
      data: [...pairs].map(([, url, title]) => ({ url, title })),
    };
  }
  if (dataTransfer.types.includes(URI_LIST)) {
    const titles = linkTitles(dataTransfer.getData(DATA_TYPE_KEYS.html));
    return {
      type: "urls",
      data: parseUriList(dataTransfer.getData(URI_LIST)).map((url) => ({
        url,
        title: titles.get(url) || url,
      })),
    };
  }
};

/** Chromium's link format, read on drop but never written. */
const URI_LIST = "text/uri-list";

/** URLs in a text/uri-list (RFC 2483): one per line, `#` lines are comments. */
const parseUriList = (uriList: string) =>
  uriList
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

/** Each link's text in a drop's text/html, by its href. */
const linkTitles = (html: string) => {
  if (!html) return new Map<string, string>();
  const anchors = new DOMParser()
    .parseFromString(html, "text/html")
    .querySelectorAll("a[href]");
  return new Map(
    [...anchors].map((anchor) => [
      anchor.getAttribute("href")!,
      anchor.textContent?.trim() ?? "",
    ]),
  );
};
