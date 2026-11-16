import type { LocalStore } from "./localStore";

/** An in-memory stand-in for window.localStorage, for unit tests. */
export const memoryStore = (items: Record<string, string> = {}) => ({
  items,
  getItem: (key: string) => items[key] ?? null,
  setItem: (key: string, value: string) => {
    items[key] = value;
  },
});

/** A localStorage that throws, as blocked or full storage does. */
export const unavailableStore: LocalStore = {
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("QuotaExceededError");
  },
};
