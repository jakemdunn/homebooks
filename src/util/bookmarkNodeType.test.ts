import { describe, expect, it } from "vitest";
import type { Bookmarks } from "webextension-polyfill";
import { withBookmarkNodeType } from "./bookmarkNodeType";

describe("withBookmarkNodeType", () => {
  it("marks a Chromium node with a url as a bookmark", () => {
    const node = { id: "7", title: "Example", url: "https://example.com/" };
    expect(withBookmarkNodeType(node as Bookmarks.BookmarkTreeNode).type).toBe(
      "bookmark",
    );
  });

  it("marks a Chromium node without a url as a folder, including nested children", () => {
    const node = {
      id: "5",
      title: "Root",
      children: [
        { id: "6", title: "Folder A", children: [] },
        { id: "7", title: "Example", url: "https://example.com/" },
      ],
    } as Bookmarks.BookmarkTreeNode;

    const result = withBookmarkNodeType(node);

    expect(result.type).toBe("folder");
    expect(result.children?.map((child) => child.type)).toEqual([
      "folder",
      "bookmark",
    ]);
  });

  it("leaves a Firefox node's existing type untouched", () => {
    const separator = {
      id: "s",
      title: "",
      type: "separator",
      url: "data:",
    } as Bookmarks.BookmarkTreeNode;
    expect(withBookmarkNodeType(separator).type).toBe("separator");
  });
});
