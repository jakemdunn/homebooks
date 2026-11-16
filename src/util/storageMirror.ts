import {
  type LocalStore,
  isRecord,
  readLocalJson,
  writeLocalJson,
} from "./localStore";

/** Storage areas mirrored into localStorage. */
export type MirroredArea = "local" | "sync";

/**
 * The last values seen in an extension storage area. `known` lists every
 * key whose value is known, including keys storage has no value for, which
 * have no entry in `values`.
 */
export type StorageMirror = {
  values: Record<string, unknown>;
  known: string[];
};

const EMPTY: StorageMirror = { values: {}, known: [] };

const mirrorKey = (area: MirroredArea) => `homebooks.storage.${area}`;

/**
 * The area's copy in localStorage, so a new page can render with it
 * synchronously, before `browser.storage` answers. Empty when there's no
 * usable copy.
 */
export const readStorageMirror = (
  area: MirroredArea,
  store?: LocalStore,
): StorageMirror => {
  const saved = readLocalJson(mirrorKey(area), store);
  if (!isRecord(saved) || !isRecord(saved.values)) return EMPTY;
  const known = Array.isArray(saved.known)
    ? saved.known.filter((key): key is string => typeof key === "string")
    : [];
  return { values: saved.values, known };
};

/** Replaces the area's copy. */
export const writeStorageMirror = (
  area: MirroredArea,
  mirror: StorageMirror,
  store?: LocalStore,
) => writeLocalJson(mirrorKey(area), mirror, store);
