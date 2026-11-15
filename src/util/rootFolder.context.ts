import { createContext, useContext } from "react";

export const RootFolderContext = createContext<string | undefined>(undefined);

/** The Root Folder in use, or undefined while it resolves. */
export const useRootFolder = () => useContext(RootFolderContext);
