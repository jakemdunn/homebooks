import { describe, expect, it } from "vitest";
import { readStorageMirror, writeStorageMirror } from "./storageMirror";
import { memoryStore, unavailableStore } from "./localStore.fakes";

const SYNC = {
  values: { settings: { rootFolder: "42" } },
  known: ["settings", "expanded"],
};

describe("storage mirror", () => {
  it("reads back what was written, per storage area", () => {
    const store = memoryStore();
    writeStorageMirror("sync", SYNC, store);
    writeStorageMirror("local", { values: { a: 1 }, known: ["a"] }, store);

    expect(readStorageMirror("sync", store)).toEqual(SYNC);
    expect(readStorageMirror("local", store)).toEqual({
      values: { a: 1 },
      known: ["a"],
    });
  });

  it("replaces the area's previous copy", () => {
    const store = memoryStore();
    writeStorageMirror("sync", SYNC, store);
    writeStorageMirror("sync", { values: {}, known: ["expanded"] }, store);

    expect(readStorageMirror("sync", store)).toEqual({
      values: {},
      known: ["expanded"],
    });
  });

  it("is empty when nothing was written", () => {
    expect(readStorageMirror("sync", memoryStore())).toEqual({
      values: {},
      known: [],
    });
  });

  it.each([
    ["not JSON", "{not json"],
    ["not an object", "[1,2]"],
    ["missing its values", '{"known":["a"]}'],
  ])("is empty when the saved copy is %s", (_, saved) => {
    const store = memoryStore({ "homebooks.storage.sync": saved });

    expect(readStorageMirror("sync", store)).toEqual({ values: {}, known: [] });
  });

  it("reads nothing when localStorage is unavailable", () => {
    expect(readStorageMirror("sync", unavailableStore)).toEqual({
      values: {},
      known: [],
    });
  });

  it("writes nothing, without throwing, when localStorage is unavailable", () => {
    expect(() =>
      writeStorageMirror("sync", SYNC, unavailableStore),
    ).not.toThrow();
  });

  describe("the Site Icon cache", () => {
    const LOCAL = {
      values: { menuVisibility: { a: true }, siteIcons: { "a.test": {} } },
      known: ["menuVisibility", "siteIcons"],
    };

    it("is kept in its own copy and read back with the rest", () => {
      const store = memoryStore();
      writeStorageMirror("local", LOCAL, store);

      expect(Object.keys(store.items).sort()).toEqual([
        "homebooks.storage.local",
        "homebooks.storage.local.siteIcons",
      ]);
      expect(readStorageMirror("local", store)).toEqual(LOCAL);
    });

    it("can't stop the rest being saved when its copy doesn't fit", () => {
      const store = memoryStore();
      const full = {
        ...store,
        setItem: (key: string, value: string) => {
          if (key.endsWith(".siteIcons")) throw new Error("QuotaExceededError");
          store.setItem(key, value);
        },
      };
      writeStorageMirror("local", LOCAL, full);

      expect(readStorageMirror("local", store)).toEqual({
        values: { menuVisibility: { a: true } },
        known: ["menuVisibility"],
      });
    });
  });
});
