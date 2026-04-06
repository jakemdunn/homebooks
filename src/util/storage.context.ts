import { Dispatch, createContext, useContext } from "react";
import { storage } from "webextension-polyfill";

export type StorageType = Extract<
  keyof typeof storage,
  "local" | "sync" | "session"
>;

export type StorageContextState = {
  [Prop in StorageType]: {
    cache: Record<string, unknown>;
    incoming: string[];
    outgoing: Record<string, unknown>;
  };
};

export interface StorageContextType extends StorageContextState {
  dispatch: Dispatch<StorageAction>;
}

export type StorageAction =
  | {
      method: "set";
      values: Record<string, unknown>;
      type: StorageType;
      fromStorage?: true;
    }
  | {
      method: "load";
      defaults: Record<string, unknown>;
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
