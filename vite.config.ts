import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import webExtension, { readJsonFile } from "vite-plugin-web-extension";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";

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

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    vanillaExtractPlugin(),
    webExtension({
      manifest: generateManifest,
      browser: process.env.TARGET || "firefox",
      webExtConfig: {
        target:
          process.env.TARGET === "firefox" ? "firefox-desktop" : "chromium",
      },
    }),
  ],
});
