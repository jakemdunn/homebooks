import { defineConfig } from "vitest/config";

// Separate from vite.config.ts so the web-extension build plugin doesn't run.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
