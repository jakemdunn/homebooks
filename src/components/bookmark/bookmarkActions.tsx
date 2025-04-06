import { FC } from "react";
import { actionsStyle, actionButtonStyle } from "../../pages/Homepage.css";
import { useTobyImport } from "../../util/toby.import";
import tobyExport from "../../util/toby-export-2025-2-16-11-18-39.json";
import { FaBookmark } from "react-icons/fa";
import { useBookmarkContext } from "./bookmarkContext";

export const BookmarkActions: FC = () => {
  const bookmarkContext = useBookmarkContext();
  const tobyImport = useTobyImport();
  return (
    <section className={actionsStyle}>
      <button
        className={actionButtonStyle}
        type="button"
        onClick={() => tobyImport(tobyExport)}
      >
        Import from Toby
      </button>
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
