import { FC, useCallback, useMemo } from "react";
import browser from "webextension-polyfill";
import { Folder, FolderProps } from "../folder/folder";
import { Tab } from "./tab";
import {
  DataTransferSource,
  DragId,
  useSetDataTransfer,
} from "../drag/dragProvider.util";

export interface WindowProps extends FolderProps {
  windowId: string;
  tabs: browser.Tabs.Tab[];
  index: number;
}

export const WindowComponent: FC<WindowProps> = ({
  windowId,
  tabs,
  index,
  ...props
}) => {
  const onContextMenu = useCallback<
    React.MouseEventHandler<HTMLElement>
  >(() => {
    if (browser.menus?.overrideContext) {
      browser.menus.overrideContext({
        showDefaults: true,
      });
    }
  }, []);

  const dragId = useMemo<DragId>(() => `window-${windowId}`, [windowId]);
  const source = useMemo<DataTransferSource[]>(
    () =>
      tabs.map((tab) => ({
        url: tab.url,
        title: tab.title,
        type: "tab",
        source: tab,
      })),
    [tabs]
  );
  const onDragStart = useSetDataTransfer(source, dragId);

  return (
    <Folder
      {...props}
      data-drag-id={`window-${windowId}`}
      data-type={"window"}
      data-index={index}
      draggable
      onContextMenu={onContextMenu}
      onDragStart={onDragStart}
      key={windowId}
      id={`window-${windowId}`}
      title={`Window ${index + 1}`}
      detail={`${tabs.length} Tabs`}
    >
      {tabs.map((tab) => (
        <Tab value={tab} key={tab.id ?? `${index}-${tab.index}`} />
      ))}
    </Folder>
  );
};
