import { FC, useCallback } from "react";
import { VscCollapseAll, VscExpandAll } from "react-icons/vsc";
import { RiCloseCircleFill, RiFolderAddLine } from "react-icons/ri";
import { FaSearch } from "react-icons/fa";
import { useBookmarkContext } from "./bookmarkContext";
import { useRootFolder } from "../../util/rootFolder.context";
import { useModalsContext } from "../modals/modals.context";
import {
  actionButtonStyle,
  actionsStyle,
  searchInputStyle,
  searchInputLabelStyle,
  searchInputClearButtonStyle,
} from "./bookmarkActions.css";

export const BookmarkActions: FC = () => {
  const bookmarkContext = useBookmarkContext();
  const rootFolder = useRootFolder();
  const { openNewFolderModal } = useModalsContext();
  const addFolder = useCallback(() => {
    if (!rootFolder) return;
    openNewFolderModal({ parentId: rootFolder });
  }, [openNewFolderModal, rootFolder]);
  return (
    <section className={actionsStyle}>
      {!!bookmarkContext.bookmarks?.length && (
        <>
          <label className={searchInputLabelStyle}>
            <FaSearch />
            <input
              type="search"
              value={bookmarkContext.searchQuery}
              onChange={(e) => bookmarkContext.setSearchQuery(e.target.value)}
              placeholder="Search bookmarks…"
              aria-label="Search bookmarks"
              className={searchInputStyle}
            />
            {bookmarkContext.searchQuery ? (
              <button
                className={searchInputClearButtonStyle}
                type="button"
                onClick={() => bookmarkContext.setSearchQuery("")}
                aria-label="Clear search"
              >
                <RiCloseCircleFill />
              </button>
            ) : null}
          </label>
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
      <button
        className={actionButtonStyle}
        type="button"
        onClick={addFolder}
      >
        Add Folder
        <RiFolderAddLine />
      </button>
    </section>
  );
};
