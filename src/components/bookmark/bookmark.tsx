import { FC, useMemo } from "react";
import browser from "webextension-polyfill";
import { Folder } from "../folder/folder";
import { Item } from "../item/item";
import {
  useDataTransferFromNode,
  useSetDataTransfer,
} from "../drag/dragProvider.util";
import { useBookmarkContext } from "./bookmarkContext";

export const Bookmark: FC<{ node: browser.Bookmarks.BookmarkTreeNode }> = ({
  node,
  ...props
}) => {
  const { expanded, toggle } = useBookmarkContext();
  const isOpen = useMemo(() => expanded.includes(node.id), [expanded, node.id]);

  const url = useMemo(
    () => (node.url ? new URL(node.url) : undefined),
    [node.url]
  );

  const [source, dragId] = useDataTransferFromNode(node);
  const onDragStart = useSetDataTransfer(source, dragId);

  const [bookmarkCount, folderCount] = useMemo<[number, number]>(
    () => [
      node.children?.filter((childNode) => childNode.url).length ?? 0,
      node.children?.filter((childNode) => childNode.children).length ?? 0,
    ],
    [node.children]
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
      details={url.hostname}
      favicon={`https://www.google.com/s2/favicons?domain=${url.host}&sz=32`}
      url={node.url}
      {...props}
    >
      {node.title}
    </Item>
  );
};
