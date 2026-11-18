import { FC, PropsWithChildren, useEffect, useState } from "react";
import browser from "webextension-polyfill";
import { useBookmarkContext } from "../src/components/bookmark/bookmarkContext";
import { Bookmark } from "../src/components/bookmark/bookmark";
import { bookmarksStyle } from "../src/components/bookmark/bookmarks.css";
import { useModalsContext } from "../src/components/modals/modals.context";
import { Tab } from "../src/components/tabs/tab";
import { WindowComponent } from "../src/components/tabs/window";
import { tabsWrapperStyle } from "../src/components/tabs/tabs.css";
import { isTabUrlShownInTabsColumn } from "../src/util/restrictedTabUrl";
import { findNode, type BookmarkNode } from "./fakeBrowser/bookmarks";

/** A grid of Bookmark tiles, laid out as on the Homepage. */
export const BookmarkGrid: FC<PropsWithChildren> = ({ children }) => (
  <section className={bookmarksStyle} data-grid-container>
    {children}
  </section>
);

/** The seeded Bookmark or Folder titled `title`, as its tile. */
export const SeededBookmark: FC<{ title: string; editing?: boolean }> = ({
  title,
  editing,
}) => {
  const { bookmarks, setCurrentEdit } = useBookmarkContext();
  const node = findNode(bookmarks, (node) => node.title === title);
  const id = node?.id;
  useEffect(() => {
    if (editing && id) setCurrentEdit({ id } as BookmarkNode);
  }, [editing, id, setCurrentEdit]);
  return node ? <Bookmark node={node} /> : null;
};

/** The seeded Tab titled `title`, as its tile. */
export const SeededTab: FC<{ title: string }> = ({ title }) => {
  const [tab, setTab] = useState<browser.Tabs.Tab>();
  useEffect(() => {
    browser.tabs
      .query({})
      .then((tabs) => setTab(tabs.find((tab) => tab.title === title)));
  }, [title]);
  return tab ? <Tab value={tab} /> : null;
};

/** The seeded Window numbered `windowId`, open, as in the Tabs list. */
export const SeededWindow: FC<{ windowId: number }> = ({ windowId }) => {
  const [tabs, setTabs] = useState<browser.Tabs.Tab[]>();
  useEffect(() => {
    browser.tabs.query({ windowId }).then(setTabs);
  }, [windowId]);
  if (!tabs) return null;
  return (
    <div className={tabsWrapperStyle}>
      <div data-grid-container>
        <WindowComponent
          id={`window-${windowId}`}
          windowId={String(windowId)}
          index={windowId - 1}
          isOpen
          tabs={tabs.filter((tab) => isTabUrlShownInTabsColumn(tab.url))}
        />
      </div>
    </div>
  );
};

/** Opens the create dialog, as its menu items do. */
export const OpenCreateModal: FC<{ kind: "bookmark" | "folder" }> = ({
  kind,
}) => {
  const { openNewBookmarkModal, openNewFolderModal } = useModalsContext();
  useEffect(() => {
    if (kind === "bookmark") openNewBookmarkModal();
    else openNewFolderModal();
  }, [kind, openNewBookmarkModal, openNewFolderModal]);
  return null;
};
