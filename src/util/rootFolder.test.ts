import { describe, expect, it } from "vitest";
import { chooseRootFolder } from "./rootFolder";

/** The bookmark tree root's children, as each browser reports them. */
const FIREFOX_ROOT_CHILDREN = [
  { id: "menu________" },
  { id: "toolbar_____" },
  { id: "unfiled_____" },
  { id: "mobile______" },
];
const CHROMIUM_ROOT_CHILDREN = [
  { id: "1", folderType: "bookmarks-bar" },
  { id: "2", folderType: "other" },
  { id: "3", folderType: "mobile" },
];

describe("chooseRootFolder", () => {
  it("uses the stored Root Folder when that folder exists", () => {
    expect(chooseRootFolder({ id: "42" }, CHROMIUM_ROOT_CHILDREN)).toBe("42");
  });

  it("falls back to Firefox's Other Bookmarks when the stored folder is missing", () => {
    expect(chooseRootFolder(undefined, FIREFOX_ROOT_CHILDREN)).toBe(
      "unfiled_____",
    );
  });

  it("falls back to Chromium's Other Bookmarks by its folder type", () => {
    expect(
      chooseRootFolder(undefined, [
        { id: "7", folderType: "other" },
        { id: "8", folderType: "bookmarks-bar" },
      ]),
    ).toBe("7");
  });

  it("falls back to the root's second folder when Chromium reports no folder type", () => {
    expect(
      chooseRootFolder(undefined, [{ id: "1" }, { id: "2" }, { id: "3" }]),
    ).toBe("2");
  });

  it("doesn't use a stored id that's a Bookmark, not a Folder", () => {
    expect(
      chooseRootFolder(
        { id: "42", url: "https://example.com/" },
        CHROMIUM_ROOT_CHILDREN,
      ),
    ).toBe("2");
  });
});
