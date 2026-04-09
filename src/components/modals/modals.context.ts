import { createContext, useContext } from "react";

export type CreateModalKind = "bookmark" | "folder";

export type CreateModalDefaults = {
  title?: string;
  url?: string;
  parentId?: string;
};

export type CreateModalState = {
  kind: CreateModalKind;
  defaults: CreateModalDefaults;
};

export interface ModalsContextValue {
  createModal: CreateModalState | null;
  openNewBookmarkModal: (defaults?: CreateModalDefaults) => void;
  openNewFolderModal: (defaults?: CreateModalDefaults) => void;
  closeCreateModal: () => void;
}

export const ModalsContext = createContext<ModalsContextValue | null>(null);

export const useModalsContext = (): ModalsContextValue => {
  const ctx = useContext(ModalsContext);
  if (!ctx) {
    throw new Error("useModalsContext must be used within ModalsProvider");
  }
  return ctx;
};
