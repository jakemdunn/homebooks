import browser from "webextension-polyfill";
import { useDragContext } from "./dragContext";
import { useCallback } from "react";

export const extensionURL = browser.runtime.getURL("");

export const DRAG_DATA_KEYS = {
  sources: "text/home-books-sources",
  urls: "text/x-moz-url",
  html: "text/html",
  plain: "text/plain",
} as const;

export type DragType = "bookmark" | "folder" | "tab" | "window";
export type DragId = `${DragType}-${string}`;
export type DragPosition = "top" | "bottom" | "left" | "right" | "in";

type DataTransferTypes =
  | {
      type: "dragIds";
      data: DragId[];
    }
  | {
      type: "urls";
      data: { url: string; title: string }[];
    }
  | undefined;

export const getEventData = (event: React.DragEvent<HTMLElement>) => {
  let target = (event.target as Element | undefined)?.closest("[data-drag-id]");
  if (!target) {
    const wrapper = (event.target as Element).closest("[data-grid-container]");
    if (!wrapper) return {};
    const wrapperBounds = wrapper.getBoundingClientRect();
    let offsetX = wrapperBounds.left + 1;
    let option: Element | null | undefined = null;
    do {
      option = document
        .elementFromPoint(offsetX, event.clientY)
        ?.closest("[data-drag-id]");
      if (option) {
        target = option;
        offsetX += option.getBoundingClientRect().width + 1;
      }
    } while (option);
  }
  return {
    target: target ?? undefined,
    id: target?.getAttribute("data-drag-id") as DragId,
  };
};

const parseDataTransfer = (dataTransfer: DataTransfer): DataTransferTypes => {
  if (dataTransfer.types.includes(DRAG_DATA_KEYS.sources)) {
    const json = dataTransfer.getData(DRAG_DATA_KEYS.sources);
    try {
      return {
        type: "dragIds",
        data: JSON.parse(json) as DragId[],
      };
    } catch (error) {
      console.error(error);
    }
  }
  if (dataTransfer.types.includes(DRAG_DATA_KEYS.urls)) {
    const urls = dataTransfer.getData(DRAG_DATA_KEYS.urls);
    const pairs = urls.matchAll(/(.*)\n(.*)\n?/gm);
    return {
      type: "urls",
      data: [...pairs].map(([, url, title]) => ({ url, title })),
    };
  }
};

const processBookmarkMove = async (
  data: Exclude<DataTransferTypes, undefined>,
  id: string,
  target: Element,
  position: DragPosition,
) => {
  const destinationNode = (await browser.bookmarks.get(id))[0];
  const sourceNodes =
    data.type === "dragIds" ? await getSources(data.data) : data.data;

  if (!sourceNodes) return;

  const moveNode = async (
    node: (typeof sourceNodes)[number],
    props: Partial<
      | Parameters<typeof browser.bookmarks.move>[1]
      | Parameters<typeof browser.bookmarks.create>[0]
    >,
  ) => {
    if ("type" in node && node.type === "bookmark") {
      await browser.bookmarks.move(node.source.id, props);
      return;
    }
    if ("type" in node && node.type === "tab" && node.source.id) {
      await browser.tabs.remove(node.source.id);
    }
    await browser.bookmarks.create({
      ...props,
      title: node.title,
      url: node.url,
    });
  };

  if (position === "in" && destinationNode.type === "folder") {
    for (const sourceNode of sourceNodes) {
      moveNode(sourceNode, { parentId: destinationNode.id });
    }
    return;
  }

  const container = target?.closest("[data-grid-container]");
  if (!target || !container) throw new Error("Invalid Target for drop.");

  const targetBounds = target.getBoundingClientRect();
  const containerBounds = container.getBoundingClientRect();
  const columns = containerBounds.width / targetBounds.width;
  const columnIndex =
    (targetBounds.left - containerBounds.left) / targetBounds.width;

  const getTargetIndex: Record<DragPosition, () => number> = {
    top: () => destinationNode.index! - columnIndex,
    bottom: () => destinationNode.index! + columns - columnIndex,
    left: () => destinationNode.index!,
    right: () => destinationNode.index! + 1,
    in: () => destinationNode.index!,
  };
  let targetIndex = getTargetIndex[position!]();

  for (const sourceNode of sourceNodes) {
    if (
      "type" in sourceNode &&
      sourceNode.type === "bookmark" &&
      sourceNode.source.parentId === destinationNode.parentId &&
      sourceNode.source.index !== undefined &&
      sourceNode.source.index < destinationNode.index! &&
      position !== "in"
    ) {
      targetIndex -= 1;
    }
    moveNode(sourceNode, {
      parentId: destinationNode.parentId,
      index: targetIndex,
    });
  }
};

export const parseDragId = (input: DragId) => {
  const matches = input.match(/^(bookmark|folder|tab|window)-(.*)/);
  if (!matches) throw new Error("Invalid Drag ID");
  return [matches[1], matches[2]] as [DragType, string];
};
export const processDataTransfer = async (
  event: React.DragEvent<HTMLElement>,
  position: DragPosition,
) => {
  const { id: dragId, target } = getEventData(event);
  const data = parseDataTransfer(event.dataTransfer);

  if (!dragId || !target || !data) return;
  const [type, id] = parseDragId(dragId);

  if (type === "bookmark" || type === "folder") {
    processBookmarkMove(data, id, target, position);
  } else {
    // TODO: Handle move to windows
  }
};

export type DataTransferSource = {
  url?: string;
  title?: string;
} & (
  | {
      type: "tab";
      source: browser.Tabs.Tab;
    }
  | {
      type: "bookmark";
      source: browser.Bookmarks.BookmarkTreeNode;
    }
);
export const getSource = async (
  dragId: DragId,
  traverseFolders = false,
): Promise<DataTransferSource | DataTransferSource[]> => {
  const [type, id] = parseDragId(dragId);
  const parseBookmark = (
    node: browser.Bookmarks.BookmarkTreeNode,
  ): DataTransferSource[] => {
    if (node.type === "folder" && traverseFolders) {
      return node.children?.map((child) => parseBookmark(child)).flat() ?? [];
    }
    return [
      {
        url: node.url,
        title: node.title,
        source: node,
        type: "bookmark",
      },
    ];
  };
  switch (type) {
    case "folder":
    case "bookmark":
      return parseBookmark((await browser.bookmarks.get(id))[0]);
    case "tab": {
      const tab = await browser.tabs.get(Number(id));
      return { url: tab.url, title: tab.title, source: tab, type: "tab" };
    }
    case "window": {
      const window = await browser.windows.get(Number(id), {
        populate: true,
      });
      return (
        window.tabs
          ?.map<DataTransferSource>((child) => ({
            url: child.url,
            title: child.title,
            source: child,
            type: "tab",
          }))
          .filter((tab) => !tab.url?.includes(extensionURL)) ?? []
      );
    }
  }
};

export const getSources = async (
  sourceIds: DragId[],
  traverseFolders = false,
) => {
  const sourcePromises: Promise<DataTransferSource | DataTransferSource[]>[] =
    [];
  for (const dragId of sourceIds) {
    sourcePromises.push(getSource(dragId, traverseFolders));
  }
  const sources = (await Promise.all(sourcePromises))
    .flat()
    .filter((fetched) => fetched !== undefined && fetched.title);

  return sources?.length ? sources : undefined;
};

export const useSetDataTransfer = (
  source: DataTransferSource | DataTransferSource[],
  sourceId: DragId,
) => {
  const dragContext = useDragContext();

  return useCallback<React.DragEventHandler<HTMLElement>>(
    (event) => {
      if (event.dataTransfer.types.includes(DRAG_DATA_KEYS.sources)) return;

      const sourceIds = [...dragContext.sourceIds, sourceId];
      const sources = [...dragContext.sources, source].flat();

      if (!sources || !sources.length) return;

      event.dataTransfer.dropEffect = "move";
      event.dataTransfer.setData(
        DRAG_DATA_KEYS.sources,
        JSON.stringify(sourceIds),
      );
      event.dataTransfer.setData(
        DRAG_DATA_KEYS.urls,
        sources.map(({ url, title }) => `${url}\n${title}`).join("\n"),
      );
      event.dataTransfer.setData(
        DRAG_DATA_KEYS.html,
        sources
          .map(({ url, title }) => `<A HREF="${url}">${title}</A>`)
          .join("\n"),
      );
      event.dataTransfer.setData(
        DRAG_DATA_KEYS.plain,
        sources.map(({ url }) => url).join(", "),
      );
    },
    [dragContext.sourceIds, dragContext.sources, source, sourceId],
  );
};
