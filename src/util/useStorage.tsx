import { useCallback, useEffect } from "react";
import { StorageType, useStorageContext } from "./storage.context";

export function useStorage<T>(
  key: string,
  defaultValue: T,
  type: StorageType = "local",
): [T, (value: T) => void, boolean] {
  const { dispatch, ...storageAreas } = useStorageContext();

  const { cache, known } = storageAreas[type];
  const data = cache[key] as T | undefined;
  const setData = useCallback(
    (value: T) => {
      dispatch({
        method: "set",
        values: { [key]: value },
        type,
      });
    },
    [dispatch, key, type],
  );

  useEffect(() => {
    dispatch({ method: "load", keys: [key], type });
  }, [dispatch, key, type]);

  /** Whether the value is known, from storage or its localStorage copy. */
  const loaded = known.includes(key);
  return [data ?? defaultValue, setData, loaded];
}

/** Whether storage itself has answered for `key` on this page yet. */
export const useStorageAnswered = (key: string, type: StorageType = "local") =>
  useStorageContext()[type].answered.includes(key);
