import { FC, useCallback } from "react";
import { useBookmarkContext } from "./bookmarkContext";
import { Bookmark } from "./bookmark";
import {
  bookmarksEmptyButtonStyle,
  bookmarksEmptyIconStyle,
  bookmarksEmptyStyle,
  bookmarksStyle,
  bookmarksWrapperStyle,
} from "./bookmarks.css";
import { BookmarkActions } from "./bookmarkActions";
import { PiEmptyBold } from "react-icons/pi";
import { FileInput } from "../form/fileInput/fileInput";
import { useTobyImport } from "../../util/toby.import";

export const Bookmarks: FC = () => {
  const { bookmarks } = useBookmarkContext();
  const importToby = useTobyImport();
  const selectFile = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const imports = await importToby.parseToby(JSON.parse(await file.text()));
      await importToby.importToby(imports);
    },
    [importToby],
  );
  return (
    <div className={bookmarksWrapperStyle}>
      <BookmarkActions />
      {!bookmarks?.length && (
        <div className={bookmarksEmptyStyle}>
          <PiEmptyBold className={bookmarksEmptyIconStyle} />
          <h2>No Bookmarks!</h2>
          <p>Drag some bookmarks here from the tabs pane on the right.</p>
          <p>You can also create a new folder.</p>
          <FileInput
            onChange={selectFile}
            className={bookmarksEmptyButtonStyle}
            accept="application/json,.json"
          >
            Import bookmarks from Toby
          </FileInput>
        </div>
      )}
      <section className={bookmarksStyle} data-grid-container>
        {bookmarks?.map((bookmark) => (
          <Bookmark key={bookmark.id} node={bookmark} />
        ))}
      </section>
    </div>
  );
};
