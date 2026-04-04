import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Storage, storage } from "webextension-polyfill";
import deepEqual from "fast-deep-equal";

type StorageTypes = Extract<keyof typeof storage, "local" | "sync" | "session">;
type StorageSet<T> = (value: T) => Promise<void>;

export function useStorage<T>(
  key: string,
  defaultValue: T,
  type: StorageTypes = "local",
): [T, StorageSet<T>] {
  const dataRef = useRef<T>(defaultValue);
  const [data, setData] = useState<T>(defaultValue);
  const set = useCallback(
    (value: T) => {
      dataRef.current = value;
      setData(value);
      return storage[type].set({ [key]: value });
    },
    [key, type],
  );
  useEffect(() => {
    const getData = async (
      changes?: Storage.StorageAreaSyncOnChangedChangesType,
    ) => {
      if (changes && changes[key] === undefined) {
        return;
      }
      const updated =
        ((
          await storage[type].get(
            key as Parameters<(typeof storage)[typeof type]["get"]>[0],
          )
        )[key] as T) ?? defaultValue;
      if (!deepEqual(updated, dataRef.current)) {
        dataRef.current = updated;
        startTransition(() => {
          setData(updated);
        });
      }
    };
    storage[type].onChanged.addListener(getData);
    getData();
    return () => storage[type].onChanged.removeListener(getData);
  }, [key, type, defaultValue]);

  return [data, set];
}
