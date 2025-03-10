import { FC } from "react";
import "./global.css";
import HomeBooksIcon from "/icon/homebooks.svg?url";
import {
  contentStyle,
  headerIconStyle,
  headerStyle,
  homepageStyle,
} from "./Homepage.css";
import { BookmarkProvider } from "../components/bookmark/bookmarkContext";
import { Bookmarks } from "../components/bookmark/bookmarks";
import { DragProvider } from "../components/drag/dragContext";
import { TabsProvider } from "../components/tabs/tabs";
import { RiSettings4Fill } from "react-icons/ri";
import { ExtensionStorageProvider } from "../components/extensionStorage/extensionStorage";

export const Homepage: FC = () => {
  return (
    <ExtensionStorageProvider>
      <div className={homepageStyle}>
        <h1 className={headerStyle}>
          <img className={headerIconStyle} src={HomeBooksIcon} /> HomeBooks
          <RiSettings4Fill />
        </h1>
        <DragProvider>
          <BookmarkProvider>
            <div className={contentStyle}>
              <Bookmarks />
              <TabsProvider />
            </div>
          </BookmarkProvider>
        </DragProvider>
      </div>
    </ExtensionStorageProvider>
  );
};
