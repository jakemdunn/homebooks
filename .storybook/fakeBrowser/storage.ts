import type { Storage } from "webextension-polyfill";
import { copy, createEvent } from "./events";

export type AreaName = "local" | "sync" | "session";
export type StoredValues = Partial<Record<AreaName, Record<string, unknown>>>;

type Changes = Record<string, Storage.StorageChange>;

/** One storage area, whose values are replaced by `seed`. */
const createFakeArea = () => {
  let values: Record<string, unknown> = {};
  const onChanged = createEvent<[changes: Changes]>();

  const describeChange = (key: string, newValue: unknown) =>
    key in values ? { oldValue: values[key], newValue } : { newValue };

  const api = {
    onChanged,
    get: async (keys: string | string[]) =>
      Object.fromEntries(
        [keys]
          .flat()
          .filter((key) => key in values)
          .map((key) => [key, copy(values[key])]),
      ),
    set: async (items: Record<string, unknown>) => {
      const changes: Changes = Object.fromEntries(
        Object.entries(items).map(([key, value]) => [
          key,
          describeChange(key, value),
        ]),
      );
      Object.assign(values, copy(items));
      onChanged.emit(copy(changes));
    },
  };

  return {
    api,
    seed: (seeded: Record<string, unknown>) => (values = copy(seeded)),
  };
};

/** `browser.storage`'s three areas, in memory. */
export const createFakeStorage = () => {
  const areas = {
    local: createFakeArea(),
    sync: createFakeArea(),
    session: createFakeArea(),
  };
  return {
    api: {
      local: areas.local.api,
      sync: areas.sync.api,
      session: areas.session.api,
    },
    /** Replaces every area's values with `stored`. */
    seed: (stored: StoredValues) =>
      (Object.keys(areas) as AreaName[]).forEach((name) =>
        areas[name].seed(stored[name] ?? {}),
      ),
  };
};
