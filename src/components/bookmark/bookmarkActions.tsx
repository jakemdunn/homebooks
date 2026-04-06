import { FC, useCallback } from "react";
import { VscCollapseAll, VscExpandAll } from "react-icons/vsc";
import { RiCloseCircleFill, RiFolderAddLine } from "react-icons/ri";
import { FaSearch } from "react-icons/fa";
import browser from "webextension-polyfill";
import { useBookmarkContext } from "./bookmarkContext";
import { useSettingsStorage } from "../../util/storage.types";
import {
  actionButtonStyle,
  actionsStyle,
  searchInputStyle,
  searchInputLabelStyle,
  searchInputClearButtonStyle,
} from "./bookmarkActions.css";

export const BookmarkActions: FC = () => {
  const bookmarkContext = useBookmarkContext();
  const [settings] = useSettingsStorage();
  const addFolder = useCallback(async () => {
    if (!settings?.rootFolder) return;
    const created = await browser.bookmarks.create({
      parentId: settings.rootFolder,
      index: 0,
      title: "New Folder",
    });
    bookmarkContext.setCurrentEdit(created);
  }, [bookmarkContext, settings?.rootFolder]);
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
