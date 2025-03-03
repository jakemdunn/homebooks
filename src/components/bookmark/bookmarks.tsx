import { FC, useMemo } from "react";
import { useBookmarkContext } from "./bookmarkContext";
import { Bookmark } from "./bookmark";
import { bookmarksStyle, bookmarksWrapperStyle } from "./bookmarks.css";
import { Flipper } from "react-flip-toolkit";
import browser from "webextension-polyfill";
import { BookmarkActions } from "./bookmarkActions";

export const Bookmarks: FC = () => {
  const { bookmarks, expanded } = useBookmarkContext();
  const flipKey = useMemo(() => {
    const getKey = (node: browser.Bookmarks.BookmarkTreeNode): string => {
      if (expanded.includes(node.id)) {
        return [
          `${node.id}-expanded`,
          ...(node.children?.map(getKey) ?? []),
        ].join(",");
      }
      return node.id;
    };
    return bookmarks?.map(getKey).join(",");
  }, [bookmarks, expanded]);
  return (
    <div className={bookmarksWrapperStyle}>
      <BookmarkActions />
      <Flipper flipKey={flipKey} spring="noWobble">
        <section className={bookmarksStyle} data-grid-container>
          {bookmarks?.map((bookmark) => (
            <Bookmark key={bookmark.id} node={bookmark} />
          ))}
        </section>
      </Flipper>
    </div>
  );
};
