import { FC } from "react";
import "./global.css";
import { contentStyle, homepageStyle } from "./Homepage.css";
import { BookmarkProvider } from "../components/bookmark/bookmarkContext";
import { Bookmarks } from "../components/bookmark/bookmarks";
import { DragProvider } from "../components/drag/dragContext";
import { TabsProvider } from "../components/tabs/tabs";
import { Settings } from "../components/settings/settings";

export const Homepage: FC = () => {
  return (
    <Settings className={homepageStyle}>
      <DragProvider>
        <BookmarkProvider>
          <div className={contentStyle}>
            <Bookmarks />
            <TabsProvider />
          </div>
        </BookmarkProvider>
      </DragProvider>
    </Settings>
  );
};
