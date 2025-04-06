/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import hooksPlugin from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default tseslint.config(
  {
    ignores: ["dist"],
  },
  eslint.configs.recommended,
  reactRefresh.configs.recommended,
  tseslint.configs.recommended,
  {
    plugins: {
      // @ts-ignore
      "react-hooks": hooksPlugin,
    },
    // @ts-ignore
    rules: hooksPlugin.configs.recommended.rules,
  }
);
