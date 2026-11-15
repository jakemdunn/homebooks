import path from "node:path";
import type { PluginOptions } from "vite-plugin-web-extension";

export type DevTarget = "firefox" | "chrome";

type WebExtConfig = NonNullable<PluginOptions["webExtConfig"]>;

/**
 * How `yarn dev` launches each browser, with a persistent profile under
 * `.profiles/` so dev bookmarks survive a restart. (Each target's build
 * output is set by `OUT_DIR` in its `dev:*` script.)
 *
 * Chrome runs Playwright's Chrome for Testing: branded Google Chrome ignores
 * `--load-extension` since Chrome 137, so it can't load the dev build.
 * `CHROMIUM_BINARY` points at another Chromium instead.
 */
export const devWebExtConfig = ({
  target,
  root,
  env,
  playwrightChromium,
}: {
  target: DevTarget;
  root: string;
  env: Record<string, string | undefined>;
  playwrightChromium: () => string;
}): WebExtConfig => {
  const profile = path.join(root, ".profiles", target);
  const persistentProfile = {
    profileCreateIfMissing: true,
    keepProfileChanges: true,
  };
  return target === "firefox"
    ? {
        target: "firefox-desktop",
        firefoxProfile: profile,
        ...persistentProfile,
      }
    : {
        target: "chromium",
        chromiumBinary: env.CHROMIUM_BINARY ?? playwrightChromium(),
        chromiumProfile: profile,
        ...persistentProfile,
      };
};
