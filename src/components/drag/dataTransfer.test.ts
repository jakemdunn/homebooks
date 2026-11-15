import { describe, expect, it, vi } from "vitest";
import { parseDataTransfer } from "./dataTransfer";

/** A drop's payload: MIME type → data, as a browser exposes it. */
const payload = (data: Record<string, string>) => ({
  types: Object.keys(data),
  getData: (type: string) => data[type] ?? "",
});

describe("parseDataTransfer", () => {
  it("reads Homebooks Drag Source ids", () => {
    expect(
      parseDataTransfer(
        payload({
          "text/home-books-sources": '["bookmark-1","folder-2"]',
          "text/plain": "https://example.com/",
        }),
      ),
    ).toEqual({ type: "dragIds", data: ["bookmark-1", "folder-2"] });
  });

  it("prefers Homebooks Drag Source ids over links", () => {
    expect(
      parseDataTransfer(
        payload({
          "text/home-books-sources": '["bookmark-1"]',
          "text/x-moz-url": "https://example.com/\nExample",
        }),
      ),
    ).toEqual({ type: "dragIds", data: ["bookmark-1"] });
  });

  it("reads a Firefox link list as url/title pairs", () => {
    expect(
      parseDataTransfer(
        payload({
          "text/x-moz-url":
            "https://example.com/\nExample\nhttps://example.org/\nExample Org",
        }),
      ),
    ).toEqual({
      type: "urls",
      data: [
        { url: "https://example.com/", title: "Example" },
        { url: "https://example.org/", title: "Example Org" },
      ],
    });
  });

  it("falls back to links when the Homebooks payload is malformed", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(
      parseDataTransfer(
        payload({
          "text/home-books-sources": "not json",
          "text/x-moz-url": "https://example.com/\nExample",
        }),
      ),
    ).toEqual({
      type: "urls",
      data: [{ url: "https://example.com/", title: "Example" }],
    });
  });

  it("ignores payloads with neither type, such as Chromium's link drags", () => {
    expect(
      parseDataTransfer(
        payload({
          "text/uri-list": "https://example.com/",
          "text/plain": "https://example.com/",
        }),
      ),
    ).toBeUndefined();
  });
});
