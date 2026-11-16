import { mkdirSync } from "node:fs";
import path from "node:path";
import type { PluginOptions } from "vite-plugin-web-extension";

/** Browsers the manifest has `{{…}}` keys for, as `TARGET` names them. */
const DEV_TARGETS = ["firefox", "chrome"] as const;
export type DevTarget = (typeof DEV_TARGETS)[number];

/** Where `yarn dev` keeps each browser's persistent profile. */
const PROFILES_FOLDER = ".profiles";

/**
 * The plugin spreads this config into web-ext-run's `cmd.run`, which also
 * reads `noReloadManagerExtension`; the plugin's types don't list it.
 */
type WebExtConfig = NonNullable<PluginOptions["webExtConfig"]> & {
  noReloadManagerExtension?: boolean;
};

const isDevTarget = (value: string): value is DevTarget =>
  (DEV_TARGETS as readonly string[]).includes(value);

/** Reads `TARGET`, defaulting to Firefox. */
export const readDevTarget = (value: string | undefined): DevTarget => {
  const target = value || "firefox";
  if (!isDevTarget(target)) {
    throw new Error(
      `Unknown TARGET "${target}". Use one of: ${DEV_TARGETS.join(", ")}.`,
    );
  }
  return target;
};

/** The browser web-ext runs for a target. */
export const webExtTarget = (target: DevTarget) =>
  target === "firefox" ? "firefox-desktop" : "chromium";

/**
 * How `yarn dev` launches a browser, with a persistent profile so dev
 * bookmarks survive a restart. (Each target's build output is set by
 * `OUT_DIR` in its `dev:*` script.) `chromiumBinary` is only called for
 * Chrome.
 */
export const devWebExtConfig = async ({
  target,
  root,
  chromiumBinary,
}: {
  target: DevTarget;
  root: string;
  chromiumBinary: () => Promise<string>;
}): Promise<WebExtConfig> => {
  const profile = path.join(root, PROFILES_FOLDER, target);
  const persistentProfile = {
    profileCreateIfMissing: true,
    keepProfileChanges: true,
  };
  return target === "firefox"
    ? {
        target: webExtTarget(target),
        firefoxProfile: profile,
        ...persistentProfile,
      }
    : {
        target: webExtTarget(target),
        chromiumBinary: await chromiumBinary(),
        chromiumProfile: profile,
        ...persistentProfile,
        // web-ext-run 0.2.2 loads a Manifest V2 "reload manager" extension,
        // which Chrome for Testing refuses with "unsupported manifest
        // version". It never loads, so leaving it out loses nothing.
        noReloadManagerExtension: true,
      };
};

/** web-ext creates a missing profile folder, but not its parent. */
export const createProfilesFolder = (root: string) =>
  mkdirSync(path.join(root, PROFILES_FOLDER), { recursive: true });

/**
 * The Chromium dev runs: `CHROMIUM_BINARY` when set, otherwise Playwright's
 * Chrome for Testing. Branded Google Chrome ignores `--load-extension` since
 * Chrome 137, so it can't load the dev build.
 */
export const chromiumBinaryFrom = async (
  env: { CHROMIUM_BINARY?: string },
  playwrightChromium: () => Promise<string>,
) => env.CHROMIUM_BINARY || (await playwrightChromium());

/** Playwright's Chrome for Testing, imported only when Chrome needs it. */
export const playwrightChromium = async () => {
  const { chromium } = await import("@playwright/test");
  return chromium.executablePath();
};
