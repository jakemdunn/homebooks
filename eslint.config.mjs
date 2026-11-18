// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import hooksPlugin from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default tseslint.config(
  {
    ignores: ["dist", "dist-e2e", "dist-storybook", "test-results", "playwright-report", ".profiles"],
  },
  eslint.configs.recommended,
  reactRefresh.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ["src/**"],
    plugins: {
      "react-hooks": hooksPlugin,
    },
    rules: {
      ...hooksPlugin.configs.recommended.rules,
      // Off until existing code is fixed or found to be a false positive;
      // see #57.
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  }
);
