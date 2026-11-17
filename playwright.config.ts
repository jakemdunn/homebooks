import { defineConfig } from "@playwright/test";

// Runs against the built extension (`pnpm build:e2e` → dist-e2e), loaded
// unpacked into Playwright's Chromium. See docs/adr/0001.
//
// Runs headless: with the "chromium" channel (set on the persistent context
// in e2e/support/extension.ts), Playwright 1.65's Chromium 159 loads
// unpacked extensions headless, so no headed run is needed.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    trace: "retain-on-failure",
  },
});
