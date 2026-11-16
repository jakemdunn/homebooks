import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import webExtension, { readJsonFile } from "vite-plugin-web-extension";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import {
  chromiumBinaryFrom,
  createProfilesFolder,
  devWebExtConfig,
  playwrightChromium,
  readDevTarget,
  webExtTarget,
  type DevTarget,
} from "./build/devBrowser";
import { withSiteIconPermission } from "./build/manifest";

function generateManifest(target: DevTarget) {
  const manifest = readJsonFile("src/manifest.json");
  const pkg = readJsonFile("package.json");
  return {
    name: "HomeBooks",
    description: pkg.description,
    version: pkg.version,
    ...manifest,
    permissions: withSiteIconPermission(target, manifest.permissions),
  };
}

/** Launch options for the dev server's browser, with its profile ready. */
async function devServerWebExtConfig(target: DevTarget) {
  const root = import.meta.dirname;
  createProfilesFolder(root);
  return devWebExtConfig({
    target,
    root,
    chromiumBinary: () => chromiumBinaryFrom(process.env, playwrightChromium),
  });
}

// https://vitejs.dev/config/
export default defineConfig(async ({ command }) => {
  const target = readDevTarget(process.env.TARGET);
  return {
    build: {
      // The plugin's inner builds load this config as "build" even under
      // the dev server, so each browser's dev output folder comes from
      // OUT_DIR (set by its dev:* script).
      outDir: process.env.OUT_DIR || "dist",
    },
    plugins: [
      react(),
      vanillaExtractPlugin(),
      webExtension({
        manifest: () => generateManifest(target),
        browser: target,
        // web-ext only launches a browser from the dev server.
        webExtConfig:
          command === "serve"
            ? await devServerWebExtConfig(target)
            : { target: webExtTarget(target) },
      }),
    ],
  };
});
