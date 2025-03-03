import { FC, useCallback, useMemo } from "react";
import browser from "webextension-polyfill";
import { Folder } from "../folder/folder";
import { Item } from "../item/item";
import { useBookmarkContext } from "./bookmarkContext";
import {
  DataTransferSource,
  DragId,
  useSetDataTransfer,
} from "../drag/dragContext.util";
import { FloatingMenuItems } from "../floatingMenu/floatingMenuItems";
import { BookmarkMenu } from "../../util/bookmark.utils";

export const Bookmark: FC<{ node: browser.Bookmarks.BookmarkTreeNode }> = ({
  node,
  ...props
}) => {
  const onContextMenu = useCallback<React.MouseEventHandler<HTMLElement>>(
    (event) => {
      if (browser.menus?.overrideContext) {
        browser.menus.overrideContext({
          context: "bookmark",
          bookmarkId: node.id,
        });
      }
      event.stopPropagation();
    },
    [node.id],
  );

  const { expanded, toggle } = useBookmarkContext();
  const isOpen = useMemo(() => expanded.includes(node.id), [expanded, node.id]);

  const url = useMemo(
    () => (node.url ? new URL(node.url) : undefined),
    [node.url],
  );

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
  const onDragStart = useSetDataTransfer(source, dragId);

  const [bookmarkCount, folderCount] = useMemo<[number, number]>(
    () => [
      node.children?.filter((childNode) => childNode.url).length ?? 0,
      node.children?.filter((childNode) => childNode.children).length ?? 0,
    ],
    [node.children],
  );
  const detailText = useMemo(() => {
    const details: string[] = [];
    if (bookmarkCount) {
      details.push(`${bookmarkCount} Bookmark${bookmarkCount > 1 ? "s" : ""}`);
    }
    if (folderCount) {
      details.push(`${folderCount} Folder${folderCount > 1 ? "s" : ""}`);
    }
    return details.join(", ");
  }, [bookmarkCount, folderCount]);

  if (node.type === "separator") return <hr />;
  if (node.type === "folder") {
    return (
      <Folder
        data-drag-id={`folder-${node.id}`}
        data-index={node.index}
        draggable
        id={`folder-${node.id}`}
        isOpen={isOpen}
        onClick={() => toggle(node.id)}
        onContextMenu={onContextMenu}
        onDragStart={onDragStart}
        title={node.title}
        detail={detailText}
      >
        {node.children?.map((child) => (
          <Bookmark node={child} key={child.id} />
        ))}
      </Folder>
    );
  }

  if (!node.url || !url) return null;

  return (
    <Item
      id={`bookmark-${node.id}`}
      data-drag-id={`bookmark-${node.id}`}
      data-index={node.index}
      draggable
      onDragStart={onDragStart}
      onContextMenu={onContextMenu}
      details={url.hostname}
      favicon={`https://www.google.com/s2/favicons?domain=${url.host}&sz=32`}
      url={node.url}
      contextActions={
        <FloatingMenuItems
          items={BookmarkMenu}
          menuActionProps={{ bookmarkId: node.id }}
        />
      }
      {...props}
    >
      {node.title}
    </Item>
  );
};
