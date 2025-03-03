import { FC, useCallback, useMemo } from "react";
import browser from "webextension-polyfill";
import { Item } from "../item/item";
import {
  DataTransferSource,
  DragId,
  useSetDataTransfer,
} from "../drag/dragContext.util";

export const Tab: FC<{ value: browser.Tabs.Tab }> = ({ value }) => {
  const url = useMemo(() => new URL(value.url!), [value.url]);
  const onContextMenu = useCallback<
    React.MouseEventHandler<HTMLElement>
  >(() => {
    if (browser.menus?.overrideContext && value.id) {
      browser.menus.overrideContext({
        context: "tab",
        tabId: value.id,
      });
    }
  }, [value]);

  const dragId = useMemo<DragId>(() => `tab-${value.id}`, [value.id]);
  const source = useMemo<DataTransferSource>(
    () => ({ url: value.url, title: value.title, id: dragId }),
    [dragId, value.title, value.url],
  );
  const onDragStart = useSetDataTransfer(source, dragId);

  const onClick = useCallback(() => {
    browser.tabs.update(value.id!, {
      active: true,
    });
    browser.windows.update(value.windowId!, {
      focused: true,
    });
  }, [value.id, value.windowId]);
  return (
    <Item
      data-drag-id={`tab-${value.id}`}
      data-index={value.index}
      details={url.hostname}
      draggable
      favicon={value.favIconUrl!}
      id={value.id?.toString() ?? "0"}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onDragStart={onDragStart}
      url={value.url!}
    >
      {value.title}
    </Item>
  );
};
