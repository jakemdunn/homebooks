import browser, { Bookmarks } from "webextension-polyfill";
import { useDragContext } from "./dragContext";
import { useCallback, useMemo } from "react";
import {
  DATA_TYPE_KEYS,
  parseDataTransfer,
  type DataTransferTypes,
} from "./dataTransfer";
import type { DragId, DragPosition, DragType } from "./dragTypes";
import { isTabUrlShownInTabsColumn } from "../../util/restrictedTabUrl";
import { tabSiteIcon } from "../../util/siteIconCache";
import { sendSiteIcons } from "../../util/siteIconMessages";

export type { DragId, DragPosition, DragType };

export const getEventData = (
  event: React.DragEvent<HTMLElement> | React.MouseEvent<HTMLElement>,
) => {
  let target = (event.target as HTMLElement | undefined)?.closest(
    "[data-drag-id]",
  ) as HTMLElement | undefined;
  if (!target) {
    const wrapper = (event.target as HTMLElement).closest(
      "[data-grid-container]",
    );
    if (!wrapper) return {};
    const wrapperBounds = wrapper.getBoundingClientRect();
    let offsetX = wrapperBounds.left + 1;
    let option: HTMLElement | null | undefined = null;
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
    await browser.bookmarks.create({
      ...props,
      title: node.title,
      url: node.url,
    });
    // Only once its Bookmark exists, so a failed create loses nothing.
    if ("type" in node && node.type === "tab" && node.source.id) {
      // Sent now: the Tab is gone by the time the background hears of
      // the new Bookmark.
      const icon = tabSiteIcon(node.source);
      if (icon)
        sendSiteIcons("siteIcons.tabsBookmarked", [icon]).catch((error) =>
          console.error("Couldn't record a dropped Tab's Site Icon.", error),
        );
      await browser.tabs.remove(node.source.id);
    }
  };

  // One at a time, in order: a failed move stops the rest, and the error
  // reaches the drop handler.
  if (position === "in" && destinationNode.type === "folder") {
    for (const sourceNode of sourceNodes) {
      await moveNode(sourceNode, { parentId: destinationNode.id });
    }
    return;
  }

  const container = target?.closest("[data-grid-container]");
  if (!target || !container) throw new Error("Invalid Target for drop.");

  const targetBounds = target.getBoundingClientRect();
  const containerBounds = container.getBoundingClientRect();
  const columns = Math.round(containerBounds.width / targetBounds.width);
  const columnIndex = Math.round(
    (targetBounds.left - containerBounds.left) / targetBounds.width,
  );

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
    await moveNode(sourceNode, {
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
export const useParseDragId = (id: DragId) =>
  useMemo(() => parseDragId(id), [id]);
export const processDataTransfer = async (
  event: React.DragEvent<HTMLElement>,
  position: DragPosition,
) => {
  const { id: dragId, target } = getEventData(event);
  const data = parseDataTransfer(event.dataTransfer);

  if (!dragId || !target || !data) return;
  const [type, id] = parseDragId(dragId);

  if (type === "bookmark" || type === "folder") {
    await processBookmarkMove(data, id, target, position);
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
          .filter((tab) => isTabUrlShownInTabsColumn(tab.url)) ?? []
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

export const useDataTransferFromNode = (
  node: Bookmarks.BookmarkTreeNode,
): [DataTransferSource | DataTransferSource[], DragId] => {
  const dragId = useMemo<DragId>(
    () => `${node.type === "bookmark" ? "bookmark" : "folder"}-${node.id}`,
    [node.id, node.type],
  );
  const source = useMemo<DataTransferSource | DataTransferSource[]>(
    () =>
      node.type === "bookmark"
        ? { url: node.url, title: node.title, type: "bookmark", source: node }
        : (node.children?.map((child) => ({
            url: child.url,
            title: child.title,
            type: "bookmark",
            source: child,
          })) ?? []),
    [node],
  );
  return [source, dragId];
};

export const useSetDataTransfer = (
  source: DataTransferSource | DataTransferSource[],
  sourceId: DragId,
) => {
  // Read when the drag starts, not subscribed to: every tile uses this.
  const { store, sources: currentSources } = useDragContext();

  return useCallback<React.DragEventHandler<HTMLElement>>(
    (event) => {
      if (event.dataTransfer.types.includes(DATA_TYPE_KEYS.sources)) return;

      const sourceIds = [...store.getState().sourceIds, sourceId];
      const sources = [...currentSources.current, source].flat();

      event.dataTransfer.dropEffect = "move";
      event.dataTransfer.setData(
        DATA_TYPE_KEYS.sources,
        JSON.stringify(sourceIds),
      );

      // Other apps get links only: a Folder with no Bookmarks has none.
      const links = sources.filter(({ url }) => url);
      if (!links.length) return;
      event.dataTransfer.setData(
        DATA_TYPE_KEYS.urls,
        links.map(({ url, title }) => `${url}\n${title}`).join("\n"),
      );
      event.dataTransfer.setData(
        DATA_TYPE_KEYS.html,
        links
          .map(({ url, title }) => `<A HREF="${url}">${title}</A>`)
          .join("\n"),
      );
      event.dataTransfer.setData(
        DATA_TYPE_KEYS.plain,
        links.map(({ url }) => url).join(", "),
      );
    },
    [store, currentSources, source, sourceId],
  );
};
