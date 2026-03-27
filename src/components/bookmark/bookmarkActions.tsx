import { FC } from "react";
import { actionsStyle, actionButtonStyle } from "../../pages/Homepage.css";
import { VscCollapseAll, VscExpandAll } from "react-icons/vsc";
import { RiFolderAddLine } from "react-icons/ri";
import { useBookmarkContext } from "./bookmarkContext";

export const BookmarkActions: FC = () => {
  const bookmarkContext = useBookmarkContext();
  return (
    <section className={actionsStyle}>
      {!!bookmarkContext.bookmarks?.length && (
        <>
          <button
            className={actionButtonStyle}
            type="button"
            onClick={bookmarkContext.expandAll}
          >
            Expand All
            <VscExpandAll />
          </button>
          <button
            className={actionButtonStyle}
            type="button"
            onClick={bookmarkContext.collapseAll}
          >
            Collapse All
            <VscCollapseAll />
          </button>
        </>
      )}
      <button className={actionButtonStyle} type="button">
        Add Folder
        <RiFolderAddLine />
      </button>
    </section>
  );
};
