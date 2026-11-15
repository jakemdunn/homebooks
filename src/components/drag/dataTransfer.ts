import type { DragId } from "./dragTypes";

export const DATA_TYPE_KEYS = {
  sources: "text/home-books-sources",
  urls: "text/x-moz-url",
  html: "text/html",
  plain: "text/plain",
  /** Chromium's link format, read on drop but never written. */
  uriList: "text/uri-list",
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

type DropData = Pick<DataTransfer, "types" | "getData">;

/**
 * What a drop carries, from the first format present: Homebooks' own Drag
 * Source ids, then Firefox's link list, then Chromium's.
 */
export const parseDataTransfer = (dataTransfer: DropData): DataTransferTypes =>
  readDragIds(dataTransfer) ??
  readMozUrls(dataTransfer) ??
  readUriList(dataTransfer);

const readDragIds = (dataTransfer: DropData): DataTransferTypes => {
  if (!dataTransfer.types.includes(DATA_TYPE_KEYS.sources)) return;
  try {
    return {
      type: "dragIds",
      data: JSON.parse(
        dataTransfer.getData(DATA_TYPE_KEYS.sources),
      ) as DragId[],
    };
  } catch (error) {
    console.error(error);
  }
};

/** Firefox's text/x-moz-url: a URL line, then its title line. */
const readMozUrls = (dataTransfer: DropData): DataTransferTypes => {
  if (!dataTransfer.types.includes(DATA_TYPE_KEYS.urls)) return;
  const pairs = dataTransfer
    .getData(DATA_TYPE_KEYS.urls)
    .matchAll(/(.*)\n(.*)\n?/gm);
  return {
    type: "urls",
    data: [...pairs].map(([, url, title]) => ({ url, title })),
  };
};

/** Chromium's text/uri-list, titled from the drop's text/html links. */
const readUriList = (dataTransfer: DropData): DataTransferTypes => {
  if (!dataTransfer.types.includes(DATA_TYPE_KEYS.uriList)) return;
  const titles = linkTitles(dataTransfer.getData(DATA_TYPE_KEYS.html));
  return {
    type: "urls",
    data: parseUriList(dataTransfer.getData(DATA_TYPE_KEYS.uriList)).map(
      (url) => ({ url, title: titles.get(url) || url }),
    ),
  };
};

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
