import { mkdirSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import webExtension, { readJsonFile } from "vite-plugin-web-extension";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import { devWebExtConfig, type DevTarget } from "./build/devBrowser";

function generateManifest() {
  const manifest = readJsonFile("src/manifest.json");
  const pkg = readJsonFile("package.json");
  return {
    name: "HomeBooks",
    description: pkg.description,
    version: pkg.version,
    ...manifest,
  };
}

const TARGETS: DevTarget[] = ["firefox", "chrome"];

function readTarget(): DevTarget {
  const target = process.env.TARGET || "firefox";
  if (!TARGETS.includes(target as DevTarget)) {
    throw new Error(
      `Unknown TARGET "${target}". Use one of: ${TARGETS.join(", ")}.`,
    );
  }
  return target as DevTarget;
}

// https://vitejs.dev/config/
export default defineConfig(async ({ command }) => {
  const target = readTarget();
  if (command === "serve") {
    // web-ext creates a missing profile folder, but not its parent.
    mkdirSync(path.join(import.meta.dirname, ".profiles"), { recursive: true });
  }
  // web-ext only launches a browser from the dev server. The plugin's inner
  // builds load this config as "build", so the output folder comes from
  // OUT_DIR (set per browser by the dev:* scripts), not from here.
  const devConfig =
    command === "serve"
      ? devWebExtConfig({
          target,
          root: import.meta.dirname,
          env: process.env,
          playwrightChromium: await playwrightChromiumPath(),
        })
      : undefined;

  return {
    build: {
      outDir: process.env.OUT_DIR || "dist",
    },
    plugins: [
      react(),
      vanillaExtractPlugin(),
      webExtension({
        manifest: generateManifest,
        browser: target,
        webExtConfig: devConfig ?? {
          target: target === "firefox" ? "firefox-desktop" : "chromium",
        },
      }),
    ],
  };
});

/** Loads Playwright only when dev needs it, so builds don't. */
async function playwrightChromiumPath() {
  const { chromium } = await import("@playwright/test");
  return () => chromium.executablePath();
}
