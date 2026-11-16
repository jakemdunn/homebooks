import {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import browser from "webextension-polyfill";
import { Folder } from "../folder/folder";
import { Item } from "../item/item";
import {
  useDataTransferFromNode,
  useSetDataTransfer,
} from "../drag/dragProvider.util";
import { useBookmarkContext } from "./bookmarkContext";
import { bookmarkEditInputStyle, bookmarkEditRowStyle } from "./bookmark.css";
import { bookmarksStyle } from "./bookmarks.css";
import { BookmarkFolderEmptyState } from "./bookmarkFolderEmpty";
import { SiteIcon } from "../siteIcon/siteIcon";

function useDismissOnOutsideClick(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  procDismiss: () => void,
) {
  useEffect(() => {
    if (!active) return;
    const listener = (e: PointerEvent) => {
      if (ref.current?.contains(e.target as Node)) return;
      e.preventDefault();
      e.stopPropagation();
      procDismiss();
    };
    document.addEventListener("pointerdown", listener, true);
    return () => document.removeEventListener("pointerdown", listener, true);
  }, [active, procDismiss, ref]);
}

const BookmarkFolderEditing: FC<{
  node: browser.Bookmarks.BookmarkTreeNode;
  detailText: string;
  onDragStart: (e: React.DragEvent<HTMLElement>) => void;
}> = ({ node, detailText, onDragStart }) => {
  const { expanded, setCurrentEdit } = useBookmarkContext();
  const isOpen = expanded.includes(node.id);
  const bookmarkOnlyCount = useMemo(
    () => node.children?.filter((childNode) => childNode.url).length ?? 0,
    [node.children],
  );
  const [title, setTitle] = useState(node.title);
  const titleRef = useRef(title);
  titleRef.current = title;

  useEffect(() => {
    setTitle(node.title);
  }, [node.id, node.title]);

  const wrapRef = useRef<HTMLDivElement>(null);

  const saveTitle = useCallback(() => {
    void browser.bookmarks.update(node.id, { title: titleRef.current.trim() });
  }, [node.id]);

  const dismiss = useCallback(() => {
    void browser.bookmarks.update(node.id, { title: titleRef.current.trim() });
    setCurrentEdit(undefined);
  }, [node.id, setCurrentEdit]);

  useDismissOnOutsideClick(wrapRef, true, dismiss);

  return (
    <div
      ref={wrapRef}
      className={bookmarkEditRowStyle}
      data-drag-id={`folder-${node.id}`}
      data-index={node.index}
      onDragStart={onDragStart}
      draggable={false}
    >
      <input
        className={bookmarkEditInputStyle}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={saveTitle}
        autoFocus
        aria-label="Folder title"
      />
      {detailText ? (
        <span style={{ fontSize: "0.85em", opacity: 0.75 }}>{detailText}</span>
      ) : null}
      {isOpen && (
        <section className={bookmarksStyle} data-grid-container>
          {node.children?.map((child) => (
            <Bookmark node={child} key={child.id} />
          ))}
          {bookmarkOnlyCount === 0 ? (
            <BookmarkFolderEmptyState folderId={node.id} />
          ) : null}
        </section>
      )}
    </div>
  );
};

const BookmarkItemEditing: FC<{
  node: browser.Bookmarks.BookmarkTreeNode;
  onDragStart: (e: React.DragEvent<HTMLElement>) => void;
}> = ({ node, onDragStart }) => {
  const { setCurrentEdit } = useBookmarkContext();
  const [title, setTitle] = useState(node.title);
  const [urlStr, setUrlStr] = useState(node.url ?? "");
  const titleRef = useRef(title);
  const urlRef = useRef(urlStr);
  titleRef.current = title;
  urlRef.current = urlStr;

  useEffect(() => {
    setTitle(node.title);
    setUrlStr(node.url ?? "");
  }, [node.id, node.title, node.url]);

  const wrapRef = useRef<HTMLDivElement>(null);

  const saveTitleField = useCallback(() => {
    void browser.bookmarks.update(node.id, { title: titleRef.current.trim() });
  }, [node.id]);

  const saveUrlField = useCallback(() => {
    const u = urlRef.current.trim();
    try {
      new URL(u);
      void browser.bookmarks.update(node.id, { url: u });
    } catch {
      /* keep previous URL in storage */
    }
  }, [node.id]);

  const dismiss = useCallback(() => {
    const t = titleRef.current.trim();
    const u = urlRef.current.trim();
    try {
      new URL(u);
      void browser.bookmarks.update(node.id, { title: t, url: u });
    } catch {
      void browser.bookmarks.update(node.id, { title: t });
    }
    setCurrentEdit(undefined);
  }, [node.id, setCurrentEdit]);

  useDismissOnOutsideClick(wrapRef, true, dismiss);

  return (
    <div
      ref={wrapRef}
      className={bookmarkEditRowStyle}
      data-drag-id={`bookmark-${node.id}`}
      data-index={node.index}
      onDragStart={onDragStart}
      draggable={false}
    >
      <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
        {/* The saved URL's icon: one being typed isn't a Bookmark yet. */}
        {node.url ? <SiteIcon url={node.url} /> : null}
        <input
          className={bookmarkEditInputStyle}
          style={{ flex: 1 }}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitleField}
          autoFocus
          aria-label="Bookmark title"
        />
      </div>
      <input
        className={bookmarkEditInputStyle}
        value={urlStr}
        onChange={(e) => setUrlStr(e.target.value)}
        onBlur={saveUrlField}
        aria-label="Bookmark URL"
      />
    </div>
  );
};

export const Bookmark: FC<{ node: browser.Bookmarks.BookmarkTreeNode }> = ({
  node,
  ...props
}) => {
  const { expanded, toggle, currentEdit } = useBookmarkContext();
  const isEditing = currentEdit?.id === node.id;
  const isOpen = useMemo(() => expanded.includes(node.id), [expanded, node.id]);

  const url = useMemo(() => {
    if (!node.url) return undefined;
    try {
      return new URL(node.url);
    } catch {
      return undefined;
    }
  }, [node.url]);

  const [source, dragId] = useDataTransferFromNode(node);
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
    if (isEditing) {
      return (
        <BookmarkFolderEditing
          node={node}
          detailText={detailText}
          onDragStart={onDragStart}
        />
      );
    }
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
        {bookmarkCount === 0 ? (
          <BookmarkFolderEmptyState folderId={node.id} />
        ) : null}
      </Folder>
    );
  }

  if (!node.url) return null;

  if (isEditing) {
    return <BookmarkItemEditing node={node} onDragStart={onDragStart} />;
  }

  if (!url) return null;

  return (
    <Item
      id={`bookmark-${node.id}`}
      data-drag-id={`bookmark-${node.id}`}
      data-index={node.index}
      draggable
      onDragStart={onDragStart}
      details={url.hostname}
      icon={<SiteIcon url={node.url} />}
      url={node.url}
      {...props}
    >
      {node.title}
    </Item>
  );
};
