import type { DevTarget } from "./devBrowser";

/** The manifest's permissions, plus what Site Icons need on `target`. */
export const withSiteIconPermission = (
  target: DevTarget,
  permissions: string[],
): string[] =>
  target === "chrome" ? [...permissions, "favicon"] : permissions;
