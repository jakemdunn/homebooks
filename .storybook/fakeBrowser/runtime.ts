import type { Runtime } from "webextension-polyfill";
import messages from "../../public/_locales/en/messages.json";
import manifest from "../../src/manifest.json";
import { version } from "../../package.json";

/** `browser.i18n`: the extension's English messages. */
export const fakeI18n = {
  getMessage: (name: string) =>
    (messages as Record<string, { message: string }>)[name]?.message ?? "",
};

/** `browser.runtime`, as Firefox's, so the Chromium shim stays off. */
export const fakeRuntime = {
  getBrowserInfo: async (): Promise<Runtime.BrowserInfo> => ({
    name: "Firefox",
    vendor: "Mozilla",
    version: "145.0",
    buildID: "20260101000000",
  }),
  getManifest: () => ({
    manifest_version: 2,
    name: "HomeBooks",
    version,
    permissions: manifest.permissions,
  }),
  getURL: (path: string) =>
    new URL(path, "moz-extension://homebooks-storybook/").href,
  /** No background runs here: messages are taken and dropped. */
  sendMessage: async (message: unknown) => void message,
};
