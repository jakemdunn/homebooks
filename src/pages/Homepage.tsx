import { FC } from "react";
import "./global.css";
import { contentStyle, homepageStyle } from "./Homepage.css";
import { BookmarkProvider } from "../components/bookmark/bookmarkProvider";
import { Bookmarks } from "../components/bookmark/bookmarks";
import { DragProvider } from "../components/drag/dragProvider";
import { TabsProvider } from "../components/tabs/tabs";
import { Settings } from "../components/settings/settings";
import { FloatingMenuHandler } from "../components/floatingMenu/floatingMenu.handler";
import { StorageProvider } from "../util/storage.provider";
import { ModalsProvider } from "../components/modals/modals.provider";
import { CreateItemModal } from "../components/createItem/createItemModal";

export const Homepage: FC = () => {
  return (
    <StorageProvider>
      <DragProvider>
        <BookmarkProvider>
          <ModalsProvider>
            <FloatingMenuHandler className={homepageStyle}>
              <Settings>
                <div className={contentStyle}>
                  <Bookmarks />
                  <TabsProvider />
                </div>
              </Settings>
            </FloatingMenuHandler>
            <CreateItemModal />
          </ModalsProvider>
        </BookmarkProvider>
      </DragProvider>
    </StorageProvider>
  );
};
