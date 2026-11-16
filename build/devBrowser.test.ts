import { describe, expect, it } from "vitest";
import {
  chromiumBinaryFrom,
  devWebExtConfig,
  readDevTarget,
  type DevTarget,
} from "./devBrowser";

const PLAYWRIGHT_CHROMIUM = "/cache/ms-playwright/chrome-for-testing";

const configFor = (
  target: DevTarget,
  chromiumBinary = async () => PLAYWRIGHT_CHROMIUM,
) => devWebExtConfig({ target, root: "/repo", chromiumBinary });

describe("readDevTarget", () => {
  it("defaults to Firefox", () => {
    expect(readDevTarget(undefined)).toBe("firefox");
    expect(readDevTarget("")).toBe("firefox");
  });

  it("accepts Chrome", () => {
    expect(readDevTarget("chrome")).toBe("chrome");
  });

  it("rejects a target with no manifest keys, such as chromium", () => {
    expect(() => readDevTarget("chromium")).toThrow(
      'Unknown TARGET "chromium". Use one of: firefox, chrome.',
    );
  });
});

describe("devWebExtConfig", () => {
  it("runs Firefox with a persistent profile", async () => {
    expect(await configFor("firefox")).toEqual({
      target: "firefox-desktop",
      firefoxProfile: "/repo/.profiles/firefox",
      profileCreateIfMissing: true,
      keepProfileChanges: true,
    });
  });

  it("runs Chrome for Testing with a persistent profile", async () => {
    expect(await configFor("chrome")).toEqual({
      target: "chromium",
      chromiumBinary: PLAYWRIGHT_CHROMIUM,
      chromiumProfile: "/repo/.profiles/chrome",
      profileCreateIfMissing: true,
      keepProfileChanges: true,
      noReloadManagerExtension: true,
    });
  });

  it("doesn't look up a Chromium binary for Firefox", async () => {
    const config = await configFor("firefox", () => {
      throw new Error("looked up");
    });
    expect(config.target).toBe("firefox-desktop");
  });
});

describe("chromiumBinaryFrom", () => {
  const playwrightChromium = async () => PLAYWRIGHT_CHROMIUM;

  it("uses Playwright's Chrome for Testing by default", async () => {
    expect(await chromiumBinaryFrom({}, playwrightChromium)).toBe(
      PLAYWRIGHT_CHROMIUM,
    );
  });

  it("uses CHROMIUM_BINARY when it's set", async () => {
    expect(
      await chromiumBinaryFrom(
        { CHROMIUM_BINARY: "/opt/chromium" },
        playwrightChromium,
      ),
    ).toBe("/opt/chromium");
  });

  it("ignores an empty CHROMIUM_BINARY", async () => {
    expect(
      await chromiumBinaryFrom({ CHROMIUM_BINARY: "" }, playwrightChromium),
    ).toBe(PLAYWRIGHT_CHROMIUM);
  });
});
