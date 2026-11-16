import React from "react";
import ReactDOM from "react-dom/client";
import "./pages/popupGlobal.css";
import Popup from "./pages/Popup";
import { StorageProvider } from "./util/storage.provider";
import { DragProvider } from "./components/drag/dragProvider";
import { RootFolderProvider } from "./util/rootFolder.provider";
import { installChromiumBookmarksShim } from "./util/chromiumBookmarksShim";
import { installViewTransitionSettling } from "./util/settleUnchangedViewTransitions";

installChromiumBookmarksShim();
installViewTransitionSettling(document);

ReactDOM.createRoot(document.body).render(
  <React.StrictMode>
    <StorageProvider>
      <RootFolderProvider>
        <DragProvider>
          <Popup />
        </DragProvider>
      </RootFolderProvider>
    </StorageProvider>
  </React.StrictMode>,
);
