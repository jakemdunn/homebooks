import browser from "webextension-polyfill";
import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";

export interface ExtensionStorageData {
  menuVisiblity?: Record<string, boolean>;
}
export type ExtensionStorageAction = {
  type: "update";
  data: Partial<ExtensionStorageData>;
};
export interface ExtensionStorage {
  data: ExtensionStorageData;
  update: (data: Partial<ExtensionStorageData>) => void;
}

const ExtensionStorageContext = createContext<ExtensionStorage>(
  {} as ExtensionStorage
);
export const useExtensionStorageContext = () =>
  useContext(ExtensionStorageContext);

export const ExtensionStorageProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const [data, dispatch] = useReducer<
    ExtensionStorageData,
    [ExtensionStorageAction]
  >((state, action) => {
    return {
      ...state,
      ...action.data,
    };
  }, {});
  useEffect(() => {
    const onChanges = (
      changes: browser.Storage.StorageAreaOnChangedChangesType
    ) => {
      dispatch({ type: "update", data: changes });
    };
    browser.storage.local.onChanged.addListener(onChanges);

    (async () => {
      const initialData = await browser.storage.local.get(null);
      dispatch({ type: "update", data: initialData });
    })();

    return () => browser.storage.local.onChanged.removeListener(onChanges);
  }, []);
  const update: ExtensionStorage["update"] = (changes) => {
    browser.storage.local.set(changes);
  };
  const contextValue = useMemo(() => ({ data, update }), [data]);
  return (
    <ExtensionStorageContext.Provider value={contextValue}>
      {children}
    </ExtensionStorageContext.Provider>
  );
};
