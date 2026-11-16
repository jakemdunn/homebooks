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
});
