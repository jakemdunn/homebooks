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
import {
  StorageMirror,
  readStorageMirror,
  writeStorageMirror,
} from "./storageMirror";

/** An area's state, starting from its localStorage copy. */
const areaState = ({ values, known }: StorageMirror) => ({
  cache: values,
  known,
  answered: [],
  localSets: [],
  requested: [],
  incoming: [],
  outgoing: {},
});

/**
 * Starts from the localStorage copy of `local` and `sync` storage, so the
 * first render has the last-seen settings and expanded Folders.
 * `browser.storage` is still read, and replaces any value that differs.
 */
const createInitialState = (): StorageContextState => ({
  local: areaState(readStorageMirror("local")),
  sync: areaState(readStorageMirror("sync")),
  session: areaState({ values: {}, known: [] }),
});

const union = (keys: string[], more: string[]) => [
  ...new Set([...keys, ...more]),
];
const without = (keys: string[], less: string[]) =>
  keys.filter((key) => !less.includes(key));

export const StorageProvider: FC<PropsWithChildren> = ({ children }) => {
  const [storageState, storageDispatch] = useReducer(
    (
      state: StorageContextState,
      action: StorageAction,
    ): StorageContextState => {
      switch (action.method) {
        case "set": {
          const area = state[action.type];
          const keys = Object.keys(action.values);
          return {
            ...state,
            [action.type]: {
              ...area,
              outgoing: { ...area.outgoing, ...action.values },
              cache: { ...area.cache, ...action.values },
              known: union(area.known, keys),
              localSets: union(area.localSets, keys),
            },
          };
        }
        case "answer": {
          const area = state[action.type];
          // A value set here since wins until storage reports it back.
          const keys = without(action.keys, area.localSets);
          if (keys.length === 0) return state;
          const cache = { ...area.cache };
          for (const key of keys) {
            if (key in action.values) cache[key] = action.values[key];
            else delete cache[key];
          }
          return {
            ...state,
            [action.type]: {
              ...area,
              cache,
              known: union(area.known, keys),
              answered: union(area.answered, keys),
            },
          };
        }
        case "load": {
          const keys = action.keys.filter(
            (key) => !state[action.type].requested.includes(key),
          );
          if (keys.length === 0) {
            return state;
          }
          return {
            ...state,
            [action.type]: {
              ...state[action.type],
              requested: [...state[action.type].requested, ...keys],
              incoming: [...state[action.type].incoming, ...keys],
            },
          };
        }
        case "incoming-updates": {
          // Storage reporting a change means any local set has landed.
          return {
            ...state,
            [action.type]: {
              ...state[action.type],
              incoming: [...state[action.type].incoming, ...action.keys],
              localSets: without(state[action.type].localSets, action.keys),
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
    undefined,
    createInitialState,
  );

  useEffect(() => {
    const getData = async (
      changes?: Storage.StorageAreaOnChangedChangesType,
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
      const values = await storage[type].get(incoming);
      const { answered, cache } = storageState[type];
      // Storage's first answer for a key is part of loading the page, so it
      // renders directly, even where it differs from the localStorage copy.
      const firstAnswers = incoming.filter((key) => !answered.includes(key));
      if (firstAnswers.length > 0) {
        storageDispatch({ method: "answer", keys: firstAnswers, values, type });
      }
      const changes = incoming.filter(
        (key) => answered.includes(key) && !deepEqual(cache[key], values[key]),
      );
      if (changes.length > 0) {
        // A change from another page, such as a Folder expanded in another
        // tab. Untyped, so no region animates it (see viewTransitionRegion).
        startTransition(() => {
          storageDispatch({ method: "answer", keys: changes, values, type });
        });
      }
    });
  }, [storageState]);

  const { local, sync } = storageState;
  useEffect(() => {
    writeStorageMirror("local", { values: local.cache, known: local.known });
  }, [local.cache, local.known]);
  useEffect(() => {
    writeStorageMirror("sync", { values: sync.cache, known: sync.known });
  }, [sync.cache, sync.known]);

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
