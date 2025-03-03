import { FC, useCallback } from "react";
import { MenuItems, NormalMenuItem } from "../../util/menu.constants";
import { FloatingMenuItem, FloatingMenuSeparator } from "./floatingMenuItem";

interface FloatingMenuItemsProps {
  items: MenuItems;
  menuActionProps: Parameters<NormalMenuItem["action"]>[0];
}
export const FloatingMenuItems: FC<FloatingMenuItemsProps> = ({
  items,
  menuActionProps,
}) => {
  const onClick = useCallback(
    (item: NormalMenuItem) => {
      item.action(menuActionProps);
    },
    [menuActionProps],
  );
  console.log("hi?", items);
  return (
    <>
      {items.map((item) =>
        item.type === "normal" ? (
          <FloatingMenuItem onClick={() => onClick(item)} {...item} />
        ) : (
          <FloatingMenuSeparator />
        ),
      )}
      {/* // TODO: Make hint less annoying
      <div className={menuNote}>
        Did you know you can also use the right click menu? Disable "context
        menus" in settings to remove this and save space.
      </div> */}
    </>
  );
};
