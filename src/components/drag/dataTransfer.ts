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
};
