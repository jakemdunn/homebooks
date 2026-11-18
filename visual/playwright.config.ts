import { defineConfig } from "@playwright/test";
import { BROWSER_PORT } from "./browserContainer";

const STORYBOOK_PORT = 6007;

// Screenshots every story in the built Storybook (`pnpm build:storybook`
// → dist-storybook) and compares them with the committed references.
//
// The tests run here, but the browser runs in Playwright's Linux Docker
// image (see browserContainer.ts), so screenshots don't depend on this
// machine's fonts or rendering. It reaches Storybook on this machine's
// localhost through the connection (`exposeNetwork`).
export default defineConfig({
  testDir: ".",
  globalSetup: "./browserContainer.ts",
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}{ext}",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${STORYBOOK_PORT}`,
    viewport: { width: 1280, height: 800 },
    connectOptions: {
      wsEndpoint: `ws://127.0.0.1:${BROWSER_PORT}/`,
      exposeNetwork: "<loopback>",
    },
  },
  expect: {
    toHaveScreenshot: { animations: "disabled", caret: "hide" },
  },
  webServer: {
    command: `pnpm exec vite preview --config .storybook/vite.config.ts --outDir dist-storybook --port ${STORYBOOK_PORT} --strictPort`,
    cwd: "..",
    url: `http://localhost:${STORYBOOK_PORT}/index.json`,
  },
});
