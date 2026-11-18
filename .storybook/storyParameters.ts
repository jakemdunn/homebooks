import type { ContextMenuOption } from "../src/util/storage.types";
import { OTHER_BOOKMARKS } from "./fakeBrowser/fakeBrowser";

/** A story's `browser` parameter for the Settings' Item Menus option. */
export const withItemMenus = (contextMenus: ContextMenuOption) => ({
  browser: {
    storage: {
      sync: { settings: { rootFolder: OTHER_BOOKMARKS, contextMenus } },
    },
  },
});
