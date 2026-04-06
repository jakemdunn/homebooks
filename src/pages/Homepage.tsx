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

export const Homepage: FC = () => {
  return (
    <StorageProvider>
      <DragProvider>
        <BookmarkProvider>
          <FloatingMenuHandler className={homepageStyle}>
            <Settings>
              <div className={contentStyle}>
                <Bookmarks />
                <TabsProvider />
              </div>
            </Settings>
          </FloatingMenuHandler>
        </BookmarkProvider>
      </DragProvider>
    </StorageProvider>
  );
};
