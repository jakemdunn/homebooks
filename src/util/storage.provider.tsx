import {
  FC,
  PropsWithChildren,
  startTransition,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import {
  StorageContextType,
  StorageAction,
  StorageContext,
  StorageContextState,
  StorageType,
} from "./storage.context";
import { Storage, storage } from "webextension-polyfill";
import deepEqual from "fast-deep-equal";

export const StorageProvider: FC<PropsWithChildren> = ({ children }) => {
  const [storageState, storageDispatch] = useReducer<
    StorageContextState,
    [StorageAction]
  >(
    (state, action) => {
      switch (action.method) {
        case "set": {
          return {
            ...state,
            [action.type]: {
              ...state[action.type],
              outgoing: !action.fromStorage
                ? {
                    ...state[action.type].outgoing,
                    ...action.values,
                  }
                : state[action.type].outgoing,
              cache: {
                ...state[action.type].cache,
                ...action.values,
              },
            },
          };
        }
        case "load": {
          const defaults = Object.fromEntries(
            Object.entries(action.defaults).filter(
              ([key]) => !(key in state[action.type].cache),
            ),
          );
          if (Object.keys(defaults).length === 0) {
            return state;
          }
          return {
            ...state,
            [action.type]: {
              ...state[action.type],
              cache: {
                ...state[action.type].cache,
                ...defaults,
              },
              incoming: [
                ...state[action.type].incoming,
                ...Object.keys(defaults),
              ],
            },
          };
        }
        case "incoming-updates": {
          return {
            ...state,
            [action.type]: {
              ...state[action.type],
              incoming: [...state[action.type].incoming, ...action.keys],
            },
          };
        }
        case "clear-incoming": {
          return {
            ...state,
            [action.type]: {
              ...state[action.type],
              incoming: [],
            },
          };
        }
        case "clear-outgoing": {
          return {
            ...state,
            [action.type]: {
              ...state[action.type],
              outgoing: {},
            },
          };
        }
        default:
          return state;
      }
    },
    {
      local: { cache: {}, incoming: [], outgoing: {} },
      sync: { cache: {}, incoming: [], outgoing: {} },
      session: { cache: {}, incoming: [], outgoing: {} },
    },
  );

  useEffect(() => {
    const getData = async (
      changes?: Storage.StorageAreaSyncOnChangedChangesType,
      type: StorageType = "local",
    ) => {
      storageDispatch({
        method: "incoming-updates",
        type,
        keys: Object.keys(changes ?? {}),
      });
    };
    ["local", "sync", "session"].forEach((type) => {
      storage[type as StorageType].onChanged.addListener((changes) =>
        getData(changes, type as StorageType),
      );
    });
  }, []);

  useEffect(() => {
    (["local", "sync", "session"] as StorageType[]).forEach(async (type) => {
      const incoming = storageState[type as StorageType].incoming;
      if (incoming.length === 0) {
        return;
      }
      storageDispatch({
        method: "clear-incoming",
        type: type,
      });
      const updates = await storage[type].get(incoming);
      const updated = Object.fromEntries(
        Object.entries(updates).filter(([key, value]) => {
          return !deepEqual(storageState[type].cache[key], value);
        }),
      );
      if (Object.keys(updated).length > 0) {
        startTransition(() => {
          storageDispatch({
            method: "set",
            values: updated,
            type: type,
            fromStorage: true,
          });
        });
      }
    });
  }, [storageState]);

  useEffect(() => {
    (["local", "sync", "session"] as StorageType[]).forEach(async (type) => {
      const outgoing = storageState[type].outgoing;
      if (Object.keys(outgoing).length === 0) {
        return;
      }
      storageDispatch({
        method: "clear-outgoing",
        type: type,
      });
      await storage[type].set(outgoing);
    });
  }, [storageState]);

  const context = useMemo<StorageContextType>(
    () => ({
      ...storageState,
      dispatch: storageDispatch,
    }),
    [storageState],
  );

  return (
    <StorageContext.Provider value={context}>
      {children}
    </StorageContext.Provider>
  );
};
