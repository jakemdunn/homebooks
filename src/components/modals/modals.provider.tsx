import {
  FC,
  PropsWithChildren,
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  CreateModalDefaults,
  CreateModalState,
  ModalsContext,
  ModalsContextValue,
} from "./modals.context";
import { useSettingsStorage } from "../../util/storage.types";

function mergeBookmarkDefaults(
  defaults: CreateModalDefaults | undefined,
  rootFolder: string | undefined,
): CreateModalDefaults {
  return {
    title: defaults?.title ?? "",
    url: defaults?.url ?? "",
    parentId: defaults?.parentId ?? rootFolder ?? "",
  };
}

function mergeFolderDefaults(
  defaults: CreateModalDefaults | undefined,
  rootFolder: string | undefined,
): CreateModalDefaults {
  return {
    title: defaults?.title ?? "",
    parentId: defaults?.parentId ?? rootFolder ?? "",
  };
}

export const ModalsProvider: FC<PropsWithChildren> = ({ children }) => {
  const [settings] = useSettingsStorage();
  const rootFolder = settings?.rootFolder;
  const [createModal, setCreateModal] = useState<CreateModalState | null>(null);

  const openNewBookmarkModal = useCallback(
    (defaults?: CreateModalDefaults) => {
      setCreateModal({
        kind: "bookmark",
        defaults: mergeBookmarkDefaults(defaults, rootFolder),
      });
    },
    [rootFolder],
  );

  const openNewFolderModal = useCallback(
    (defaults?: CreateModalDefaults) => {
      setCreateModal({
        kind: "folder",
        defaults: mergeFolderDefaults(defaults, rootFolder),
      });
    },
    [rootFolder],
  );

  const closeCreateModal = useCallback(() => {
    setCreateModal(null);
  }, []);

  const value = useMemo<ModalsContextValue>(
    () => ({
      closeCreateModal,
      createModal,
      openNewBookmarkModal,
      openNewFolderModal,
    }),
    [closeCreateModal, createModal, openNewBookmarkModal, openNewFolderModal],
  );

  return (
    <ModalsContext.Provider value={value}>{children}</ModalsContext.Provider>
  );
};
