import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";

// Storybook's own Vite config, used instead of the root one (see main.ts):
// it keeps React and vanilla-extract, drops the web-extension plugin, and
// swaps the browser APIs for an in-memory fake.
export default defineConfig({
  plugins: [react(), vanillaExtractPlugin()],
  resolve: {
    alias: {
      "webextension-polyfill": fileURLToPath(
        new URL("./fakeBrowser/webextensionPolyfill.ts", import.meta.url),
      ),
      // The app imports the HomeBooks icon from the public folder by URL.
      // Vite's dev server refuses that import, so point it at the file.
      "/icon": fileURLToPath(new URL("../public/icon", import.meta.url)),
    },
  },
});
