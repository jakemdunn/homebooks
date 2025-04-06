import { FC } from "react";
import "./global.css";
import { contentStyle, homepageStyle } from "./Homepage.css";
import { BookmarkProvider } from "../components/bookmark/bookmarkProvider";
import { Bookmarks } from "../components/bookmark/bookmarks";
import { DragProvider } from "../components/drag/dragProvider";
import { TabsProvider } from "../components/tabs/tabs";
import { Settings } from "../components/settings/settings";

export const Homepage: FC = () => {
  return (
    <DragProvider className={homepageStyle}>
      <BookmarkProvider>
        <Settings>
          <div className={contentStyle}>
            <Bookmarks />
            <TabsProvider />
          </div>
        </Settings>
      </BookmarkProvider>
    </DragProvider>
  );
};
