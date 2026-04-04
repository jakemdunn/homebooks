import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { MenuItems, NormalMenuItem } from "../../util/menu.constants";
import { FloatingMenuItem, FloatingMenuSeparator } from "./floatingMenuItem";
import { menuNote } from "./floatingMenu.css";
import { DragId, DragType, useParseDragId } from "../drag/dragProvider.util";
import { BookmarkMenu } from "../../util/menu.bookmark";
import { TabMenu } from "../../util/menu.tab";
import browser from "webextension-polyfill";
import { useExtensionStorage } from "../../util/storage.types";
import { FolderMenu } from "../../util/menu.folder";
import { useStorage } from "../../util/useStorage";
import { SETTINGS_PANEL_VISIBLE } from "../settings/settings.util";
import { useFloatingMenuContext } from "./floatingMenu.context";

type MenuActionProps = Parameters<NormalMenuItem["action"]>;
interface FloatingMenuItemsProps {
  dragId: DragId;
}
export const FloatingMenuItems: FC<FloatingMenuItemsProps> = ({ dragId }) => {
  const [type, id] = useParseDragId(dragId);
  const menusByType = useMemo<Record<DragType, MenuItems>>(
    () => ({
      bookmark: BookmarkMenu,
      tab: TabMenu,
      folder: FolderMenu,
      window: BookmarkMenu, // TODO: WindowMenu
    }),
    [],
  );
  const items = menusByType[type];
  const [menuActionProps, setMenuActionProps] = useState<MenuActionProps>([{}]);
  useEffect(() => {
    (async () => {
      if (type === "folder") setMenuActionProps([{ bookmarkId: id }]);
      if (type === "bookmark") setMenuActionProps([{ bookmarkId: id }]);
      if (type === "tab")
        setMenuActionProps([{}, await browser.tabs.get(parseInt(id))]);
    })();
  }, [id, type]);
  const onClick = useCallback(
    (item: NormalMenuItem) => {
      item.action(...menuActionProps);
    },
    [menuActionProps],
  );
  const [menuVisibility] = useExtensionStorage();
  const visibleItems = useMemo(
    () => items.filter((item) => menuVisibility?.[item.id] !== false),
    [menuVisibility, items],
  );

  const [, setOpen] = useStorage<boolean>(
    SETTINGS_PANEL_VISIBLE,
    false,
    "session",
  );
  const { closeMenu } = useFloatingMenuContext();

  const [contextMenuNoteDismissed, setNoteDismissed] = useStorage<boolean>(
    "contextMenuNoteDismissed",
    false,
    "sync",
  );

  const openSettings = () => {
    setOpen(true);
    closeMenu();
  };
  const dismissNote = () => {
    setNoteDismissed(true);
  };

  return (
    <>
      {visibleItems.map((item) =>
        item.type === "normal" ? (
          <FloatingMenuItem
            key={item.id}
            onClick={() => onClick(item)}
            {...item}
          />
        ) : (
          <FloatingMenuSeparator key={item.id} />
        ),
      )}
      {!contextMenuNoteDismissed && (
        <div className={menuNote}>
          Did you know you can also use the right click menu? Disable "Item
          Menus" in <a onClick={openSettings}>settings</a> to remove these menus
          and save space.
          <p>
            <a onClick={dismissNote}>Dismiss</a>
          </p>
        </div>
      )}
    </>
  );
};
