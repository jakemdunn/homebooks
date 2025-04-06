import { useEffect, useMemo, useState } from "react";
import { Storage, storage } from "webextension-polyfill";

type StorageTypes = Extract<keyof typeof storage, "local" | "sync" | "session">;
// type KeyType = string | string[] | null | undefined;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StorageResponse = Record<string, any>;
type StorageSet = (typeof storage)[StorageTypes]["set"];

export function useStorage<T extends object>(
  key: T,
  type?: StorageTypes
): [T, StorageSet];
export function useStorage<T extends StorageResponse, Keys = (keyof T)[]>(
  key?: keyof T | Keys | null,
  type?: StorageTypes
): [T, StorageSet];
export function useStorage<T extends StorageResponse, Keys = (keyof T)[]>(
  key: T | keyof T | Keys,
  type: StorageTypes = "local"
): [T, StorageSet] {
  const [data, setData] = useState<T>();
  const keys = useMemo<Keys | null>(() => {
    if (key === null) return null;
    if (typeof key === "string") return [key] as Keys;
    if (Array.isArray(key)) return key as Keys;
    if (typeof key === "object") return Object.keys(key) as Keys;
    return null;
  }, [key]);

  useEffect(() => {
    const getData = async (
      changes?: Storage.StorageAreaSyncOnChangedChangesType
    ) => {
      if (
        changes &&
        Array.isArray(keys) &&
        !Object.keys(changes).some((change) => keys?.includes(change))
      ) {
        return;
      }
      setData(
        (await storage[type].get(
          key as Parameters<(typeof storage)[typeof type]["get"]>[0]
        )) as T
      );
    };
    storage[type].onChanged.addListener(getData);
    getData();
    return () => storage[type].onChanged.removeListener(getData);
  }, [key, keys, type]);

  return [data ?? ({} as T), storage[type].set];
}
