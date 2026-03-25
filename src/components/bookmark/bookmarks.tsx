import { FC, ViewTransition } from "react";
import { useBookmarkContext } from "./bookmarkContext";
import { Bookmark } from "./bookmark";
import { bookmarksStyle, bookmarksWrapperStyle } from "./bookmarks.css";
import { BookmarkActions } from "./bookmarkActions";

export const Bookmarks: FC = () => {
  const { bookmarks } = useBookmarkContext();
  return (
    <div className={bookmarksWrapperStyle}>
      <BookmarkActions />
      <ViewTransition>
        <section className={bookmarksStyle} data-grid-container>
          {bookmarks?.map((bookmark) => (
            <Bookmark key={bookmark.id} node={bookmark} />
          ))}
        </section>
      </ViewTransition>
    </div>
  );
};
