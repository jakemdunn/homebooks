/** The part of the Web Storage API the page caches use. */
export type LocalStore = Pick<Storage, "getItem" | "setItem">;

/** window.localStorage, or undefined where reading it throws. */
export const pageLocalStorage = (): LocalStore | undefined => {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
};

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * The JSON saved under `key`, or undefined when there's none or it can't be
 * read. The caches built on this only speed up the first render, so a
 * failure never throws.
 */
export const readLocalJson = (
  key: string,
  store = pageLocalStorage(),
): unknown => {
  try {
    const saved = store?.getItem(key);
    return saved == null ? undefined : JSON.parse(saved);
  } catch {
    return undefined;
  }
};

/** Saves `value` as JSON under `key`. Failures (quota, blocked) are ignored. */
export const writeLocalJson = (
  key: string,
  value: unknown,
  store = pageLocalStorage(),
): void => {
  try {
    store?.setItem(key, JSON.stringify(value));
  } catch {
    // Ignored: see readLocalJson.
  }
};
