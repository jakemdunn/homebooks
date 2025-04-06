import { useListItem } from "@floating-ui/react";
import { FC } from "react";
import { NormalMenuItem } from "../../util/menu.constants";
import { menuItem, menuItemIcon } from "./floatingMenu.css";
import { useFloatingMenuContext } from "./floatingMenu.context";

export const FloatingMenuSeparator: FC = () => <hr />;

interface FloatingMenuItemProps extends Omit<NormalMenuItem, "action"> {
  onClick: () => void;
}

export const FloatingMenuItem: FC<FloatingMenuItemProps> = ({
  id,
  title,
  onClick,
  icon: Icon,
}) => {
  const { activeIndex, getItemProps, closeMenu } = useFloatingMenuContext();
  const { ref, index } = useListItem({ label: title });

  const isActive = activeIndex === index;
  return (
    <button
      type="button"
      className={menuItem}
      key={id}
      tabIndex={isActive ? 0 : -1}
      onClick={() => {
        onClick();
        closeMenu();
      }}
      ref={ref}
      {...getItemProps}
    >
      {Icon && <Icon className={menuItemIcon} />}
      {title}
    </button>
  );
};
