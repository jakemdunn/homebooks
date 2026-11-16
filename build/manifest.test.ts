import { describe, expect, it } from "vitest";
import { withSiteIconPermission } from "./manifest";

describe("withSiteIconPermission", () => {
  it("adds Chrome's favicon permission to a Chrome build", () => {
    expect(withSiteIconPermission("chrome", ["bookmarks", "tabs"])).toEqual([
      "bookmarks",
      "tabs",
      "favicon",
    ]);
  });

  it("leaves Firefox's permissions alone: Firefox has no such permission", () => {
    expect(withSiteIconPermission("firefox", ["bookmarks", "tabs"])).toEqual([
      "bookmarks",
      "tabs",
    ]);
  });
});
