import { describe, expect, it } from "vitest";
import { devWebExtConfig } from "./devBrowser";

const PLAYWRIGHT_CHROMIUM = "/cache/ms-playwright/chrome-for-testing";
const options = (
  target: "firefox" | "chrome",
  env: Record<string, string | undefined> = {},
) =>
  devWebExtConfig({
    target,
    root: "/repo",
    env,
    playwrightChromium: () => PLAYWRIGHT_CHROMIUM,
  });

describe("devWebExtConfig", () => {
  it("runs Firefox with a persistent profile", () => {
    expect(options("firefox")).toEqual({
      target: "firefox-desktop",
      firefoxProfile: "/repo/.profiles/firefox",
      profileCreateIfMissing: true,
      keepProfileChanges: true,
    });
  });

  it("runs Chrome for Testing with a persistent profile", () => {
    expect(options("chrome")).toEqual({
      target: "chromium",
      chromiumBinary: PLAYWRIGHT_CHROMIUM,
      chromiumProfile: "/repo/.profiles/chrome",
      profileCreateIfMissing: true,
      keepProfileChanges: true,
    });
  });

  it("launches CHROMIUM_BINARY instead when it's set", () => {
    expect(
      options("chrome", { CHROMIUM_BINARY: "/opt/chromium" }).chromiumBinary,
    ).toBe("/opt/chromium");
  });

  it("doesn't look up Playwright's Chromium for Firefox", () => {
    const result = devWebExtConfig({
      target: "firefox",
      root: "/repo",
      env: {},
      playwrightChromium: () => {
        throw new Error("looked up");
      },
    });
    expect(result.target).toBe("firefox-desktop");
  });
});
