import { FC, PropsWithChildren } from "react";
import { StorageProvider } from "../src/util/storage.provider";
import { RootFolderProvider } from "../src/util/rootFolder.provider";
import { DragProvider } from "../src/components/drag/dragProvider";
import { BookmarkProvider } from "../src/components/bookmark/bookmarkProvider";
import { ModalsProvider } from "../src/components/modals/modals.provider";
import { FloatingMenuHandler } from "../src/components/floatingMenu/floatingMenu.handler";
import { CreateItemModal } from "../src/components/createItem/createItemModal";

/** The Homepage's providers, fed by the fake browser, around a story. */
export const AppProviders: FC<PropsWithChildren> = ({ children }) => (
  <StorageProvider>
    <RootFolderProvider>
      <DragProvider>
        <BookmarkProvider>
          <ModalsProvider>
            <FloatingMenuHandler>{children}</FloatingMenuHandler>
            <CreateItemModal />
          </ModalsProvider>
        </BookmarkProvider>
      </DragProvider>
    </RootFolderProvider>
  </StorageProvider>
);
