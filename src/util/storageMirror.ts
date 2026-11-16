import {
  type LocalStore,
  isRecord,
  readLocalJson,
  writeLocalJson,
} from "./localStore";
import { SITE_ICONS_KEY } from "./siteIconCache";

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
 * The Site Icon cache is copied under a key of its own, so its size (icons
 * can be `data:` URLs) can't stop the rest of `local` being saved.
 */
const separateCopyKey = (area: MirroredArea) =>
  area === "local" ? SITE_ICONS_KEY : undefined;

const separateCopyStorageKey = (area: MirroredArea, key: string) =>
  `${mirrorKey(area)}.${key}`;

/** The area's copy, without any key copied separately. */
const readSharedCopy = (
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

/**
 * The area's copy in localStorage, so a new page can render with it
 * synchronously, before `browser.storage` answers. Empty when there's no
 * usable copy.
 */
export const readStorageMirror = (
  area: MirroredArea,
  store?: LocalStore,
): StorageMirror => {
  const shared = readSharedCopy(area, store);
  const key = separateCopyKey(area);
  const saved = key
    ? readLocalJson(separateCopyStorageKey(area, key), store)
    : undefined;
  if (!key || !isRecord(saved) || !("value" in saved)) return shared;
  return {
    values: { ...shared.values, [key]: saved.value },
    known: [...shared.known, key],
  };
};

/** Replaces the area's copy. */
export const writeStorageMirror = (
  area: MirroredArea,
  { values, known }: StorageMirror,
  store?: LocalStore,
) => {
  const key = separateCopyKey(area);
  const { [key ?? ""]: separate, ...shared } = values;
  writeLocalJson(
    mirrorKey(area),
    {
      values: key ? shared : values,
      known: known.filter((known) => known !== key),
    },
    store,
  );
  if (key && known.includes(key))
    writeLocalJson(
      separateCopyStorageKey(area, key),
      { value: separate },
      store,
    );
};
