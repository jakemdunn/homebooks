import React from "react";
import ReactDOM from "react-dom/client";
import "./pages/popupGlobal.css";
import Popup from "./pages/Popup";
import { StorageProvider } from "./util/storage.provider";
import { DragProvider } from "./components/drag/dragProvider";
import { installChromiumBookmarksShim } from "./util/chromiumBookmarksShim";

installChromiumBookmarksShim();

ReactDOM.createRoot(document.body).render(
  <React.StrictMode>
    <StorageProvider>
      <DragProvider>
        <Popup />
      </DragProvider>
    </StorageProvider>
  </React.StrictMode>,
);
