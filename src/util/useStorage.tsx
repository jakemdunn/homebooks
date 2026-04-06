import { useCallback, useEffect } from "react";
import { StorageType, useStorageContext } from "./storage.context";

export function useStorage<T>(
  key: string,
  defaultValue: T,
  type: StorageType = "local",
): [T, (value: T) => void] {
  const { dispatch, ...storageAreas } = useStorageContext();

  const data = storageAreas[type].cache[key] as T;
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
    dispatch({
      method: "load",
      defaults: { [key]: defaultValue },
      type,
    });
  }, [defaultValue, dispatch, key, type]);

  return [data ?? defaultValue, setData];
}
