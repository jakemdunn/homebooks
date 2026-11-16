import React from "react";
import ReactDOM from "react-dom/client";
import { Homepage} from "./pages/Homepage"; 
import { installChromiumBookmarksShim } from "./util/chromiumBookmarksShim";
import { installViewTransitionSettling } from "./util/settleUnchangedViewTransitions";

installChromiumBookmarksShim();
installViewTransitionSettling(document);

ReactDOM.createRoot(document.body).render(
  <React.StrictMode>
    <Homepage />
  </React.StrictMode>
);
