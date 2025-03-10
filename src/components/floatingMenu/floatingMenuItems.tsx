import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { MenuItems, NormalMenuItem } from "../../util/menu.constants";
import { FloatingMenuItem, FloatingMenuSeparator } from "./floatingMenuItem";
import { menuNote } from "./floatingMenu.css";
import { useExtensionStorageContext } from "../extensionStorage/extensionStorage";
import { DragId, DragType, useParseDragId } from "../drag/dragContext.util";
import { BookmarkMenu } from "../../util/menu.bookmark";
import { TabMenu } from "../../util/menu.tab";
import browser from "webextension-polyfill";

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
      folder: BookmarkMenu, // TODO: FolderMenu
      window: BookmarkMenu, // TODO: WindowMenu
    }),
    []
  );
  const items = menusByType[type];
  const [menuActionProps, setMenuActionProps] = useState<MenuActionProps>([{}]);
  useEffect(() => {
    (async () => {
      if (type === "bookmark") setMenuActionProps([{ bookmarkId: id }]);
      if (type === "tab")
        setMenuActionProps([{}, await browser.tabs.get(parseInt(id))]);
    })();
  }, [id, type]);
  const onClick = useCallback(
    (item: NormalMenuItem) => {
      item.action(...menuActionProps);
    },
    [menuActionProps]
  );
  const extensionStorage = useExtensionStorageContext();
  const visibleItems = useMemo(
    () =>
      items.filter(
        (item) => extensionStorage.data.menuVisiblity?.[item.id] !== false
      ),
    [extensionStorage.data.menuVisiblity, items]
  );

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
        )
      )}
      {/* TODO: Make hint dismissable */}
      {/* TODO: Add direct link to settings */}
      <div className={menuNote}>
        Did you know you can also use the right click menu? Disable "Item Menus"
        in settings to remove these menus and save space.
      </div>
    </>
  );
};
