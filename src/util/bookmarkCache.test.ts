import { describe, expect, it } from "vitest";
import {
  cachedBookmarks,
  cachedRootFolder,
  writeCachedBookmarks,
  writeCachedRootFolder,
} from "./bookmarkCache";
import { memoryStore, unavailableStore } from "./localStore.fakes";

const CHILDREN = [
  {
    id: "10",
    title: "Folder",
    type: "folder" as const,
    children: [
      {
        id: "11",
        title: "Bookmark",
        url: "https://example.com/",
        type: "bookmark" as const,
      },
    ],
  },
];

/** A store holding a Root Folder and its bookmarks, both for folder "2". */
const filledStore = () => {
  const store = memoryStore();
  writeCachedRootFolder({ storedId: "unfiled_____", rootFolder: "2" }, store);
  writeCachedBookmarks({ rootFolder: "2", children: CHILDREN }, store);
  return store;
};

describe("cached Root Folder", () => {
  it("is the one resolved from the same Root Folder setting", () => {
    expect(cachedRootFolder("unfiled_____", filledStore())).toBe("2");
  });

  it("is missing once the setting has changed", () => {
    expect(cachedRootFolder("42", filledStore())).toBeUndefined();
  });

  it("is missing when nothing was cached", () => {
    expect(cachedRootFolder(undefined, memoryStore())).toBeUndefined();
  });
});

describe("cached bookmarks", () => {
  it("are the children last read for the same Root Folder", () => {
    expect(cachedBookmarks("2", filledStore())).toEqual(CHILDREN);
  });

  it("are missing for a different Root Folder", () => {
    expect(cachedBookmarks("7", filledStore())).toBeUndefined();
  });

  it("are missing while the Root Folder is unknown", () => {
    expect(cachedBookmarks(undefined, filledStore())).toBeUndefined();
  });

  it("are missing when nothing was cached", () => {
    expect(cachedBookmarks("2", memoryStore())).toBeUndefined();
  });
});

describe("a damaged cache", () => {
  const damage = (key: string, saved: string) => {
    const store = filledStore();
    store.items[key] = saved;
    return store;
  };

  it.each([
    ["not JSON", "{oops"],
    ["not an object", "[]"],
    ["missing its children", '{"rootFolder":"2"}'],
    ["with a non-string Root Folder", '{"rootFolder":2,"children":[]}'],
  ])("gives no bookmarks when the bookmarks entry is %s", (_, saved) => {
    expect(
      cachedBookmarks("2", damage("homebooks.bookmarks", saved)),
    ).toBeUndefined();
  });

  it.each([
    ["not JSON", "{oops"],
    ["not an object", "[]"],
    [
      "with a non-string Root Folder",
      '{"storedId":"unfiled_____","rootFolder":2}',
    ],
  ])("gives no Root Folder when its entry is %s", (_, saved) => {
    expect(
      cachedRootFolder("unfiled_____", damage("homebooks.rootFolder", saved)),
    ).toBeUndefined();
  });

  it("reads nothing when localStorage is unavailable", () => {
    expect(cachedBookmarks("2", unavailableStore)).toBeUndefined();
    expect(cachedRootFolder("2", unavailableStore)).toBeUndefined();
  });

  it("writes nothing, without throwing, when localStorage is unavailable", () => {
    expect(() => {
      writeCachedBookmarks(
        { rootFolder: "2", children: CHILDREN },
        unavailableStore,
      );
      writeCachedRootFolder(
        { storedId: "2", rootFolder: "2" },
        unavailableStore,
      );
    }).not.toThrow();
  });
});
