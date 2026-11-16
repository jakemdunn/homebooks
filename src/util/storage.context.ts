import { Dispatch, createContext, useContext } from "react";
import { storage } from "webextension-polyfill";

export type StorageType = Extract<
  keyof typeof storage,
  "local" | "sync" | "session"
>;

export type StorageContextState = {
  [Prop in StorageType]: {
    /** Values by key. Keys storage has no value for have no entry. */
    cache: Record<string, unknown>;
    /** Keys whose value is known, from storage or its localStorage copy. */
    known: string[];
    /** Keys storage has answered for at least once on this page. */
    answered: string[];
    /** Keys set on this page that storage hasn't yet reported back. */
    localSets: string[];
    /** Keys fetched from storage, or being fetched. */
    requested: string[];
    incoming: string[];
    outgoing: Record<string, unknown>;
  };
};

export interface StorageContextType extends StorageContextState {
  dispatch: Dispatch<StorageAction>;
}

export type StorageAction =
  | {
      /** A value set on this page, to write to storage. */
      method: "set";
      values: Record<string, unknown>;
      type: StorageType;
    }
  | {
      /** Storage's values for `keys`; a key missing from `values` has none. */
      method: "answer";
      keys: string[];
      values: Record<string, unknown>;
      type: StorageType;
    }
  | {
      method: "load";
      keys: string[];
      type: StorageType;
    }
  | {
      method: "incoming-updates";
      type: StorageType;
      keys: string[];
    }
  | {
      method: "clear-incoming";
      type: StorageType;
    }
  | {
      method: "clear-outgoing";
      type: StorageType;
    };

export const StorageContext = createContext<StorageContextType>(
  {} as StorageContextType,
);
export const useStorageContext = () => useContext(StorageContext);
