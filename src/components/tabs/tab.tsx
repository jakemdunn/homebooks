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
  const dragId = useMemo<DragId>(() => `tab-${value.id}`, [value.id]);
  const source = useMemo<DataTransferSource>(
    () => ({
      url: value.url,
      title: value.title,
      type: "tab",
      source: value,
      id: dragId,
    }),
    [dragId, value]
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

  if (!value.id || !value.windowId) return null;

  return (
    <Item
      data-drag-id={`tab-${value.id}`}
      data-index={value.index}
      details={url.hostname}
      draggable
      favicon={value.favIconUrl!}
      id={`tab-${value.id}`}
      onClick={onClick}
      onDragStart={onDragStart}
      url={value.url!}
    >
      {value.title}
    </Item>
  );
};
