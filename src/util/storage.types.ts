import { useStorage } from "./useStorage";

export interface ExtensionStorageData {
  menuVisibility?: Record<string, boolean>;
}
export const useExtensionStorage = () =>
  useStorage<ExtensionStorageData>("menuVisibility", "local");
