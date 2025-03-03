import { useListItem } from "@floating-ui/react";
import { FC } from "react";
import { NormalMenuItem } from "../../util/menu.constants";
import { useFloatingMenuContext } from "./floatingMenu";
import { menuItem } from "./floatingMenu.css";

export const FloatingMenuSeparator: FC = () => <hr />;

interface FloatingMenuItemProps extends Omit<NormalMenuItem, "action"> {
  onClick: () => void;
}

export const FloatingMenuItem: FC<FloatingMenuItemProps> = ({
  id,
  title,
  onClick,
}) => {
  const { activeIndex, getItemProps } = useFloatingMenuContext();
  const { ref, index } = useListItem({ label: title });

  const isActive = activeIndex === index;
  return (
    <button
      type="button"
      className={menuItem}
      key={id}
      tabIndex={isActive ? 0 : -1}
      onClick={onClick}
      ref={ref}
      {...getItemProps}
    >
      {title}
    </button>
  );
};
