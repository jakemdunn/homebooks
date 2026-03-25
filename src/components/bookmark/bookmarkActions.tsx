import { FC } from "react";
import { actionsStyle, actionButtonStyle } from "../../pages/Homepage.css";
import { FaBookmark } from "react-icons/fa";
import { useBookmarkContext } from "./bookmarkContext";

export const BookmarkActions: FC = () => {
  const bookmarkContext = useBookmarkContext();
  return (
    <section className={actionsStyle}>
      <button
        className={actionButtonStyle}
        type="button"
        onClick={bookmarkContext.expandAll}
      >
        Expand
      </button>
      <button
        className={actionButtonStyle}
        type="button"
        onClick={bookmarkContext.collapseAll}
      >
        Collapse
      </button>
      <button className={actionButtonStyle} type="button">
        Add Folder
      </button>
      <FaBookmark />
    </section>
  );
};
