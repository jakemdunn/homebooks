import {
  FC,
  PropsWithChildren,
  ReactNode,
  useMemo,
  ViewTransition,
} from "react";
import {
  itemWrapperStyle,
  itemStyle,
  itemTitleStyle,
  itemDetailsStyle,
  itemContent,
  itemImageStyle,
  itemActionsStyle,
} from "./item.css";
import { useDragSelector } from "../drag/dragContext";
import { useConditionalClassNames } from "../../util/useConditionalClassNames";
import { DragId } from "../drag/dragProvider.util";
import { TiThMenu } from "react-icons/ti";
import { FloatingMenuButton } from "../floatingMenu/floatingMenuButton";
import { useSettingsStorage } from "../../util/storage.types";
import { transitionClassFor, regionOf } from "../../util/viewTransitionRegion";

export type ItemProps = Omit<
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>,
  "ref"
> & {
  id: DragId;
  details: ReactNode;
  /** The item's Site Icon. */
  icon: ReactNode;
  url?: string;
};

export const Item: FC<PropsWithChildren<ItemProps>> = ({
  children,
  details,
  id,
  icon,
  onClick,
  url,
  ...props
}) => {
  // TODO: Only scale title if it's a double line on hover
  const dragging = useDragSelector((state) => state.sourceIds.has(id));
  const [settings] = useSettingsStorage();
  const itemClassNames = useConditionalClassNames(
    {
      dragging: () => dragging,
    },
    itemWrapperStyle,
  );
  const content = useMemo(
    () => (
      <>
        <span className={itemContent}>
          <span className={itemImageStyle}>{icon}</span>
          <span className={itemTitleStyle}>{children}</span>
        </span>
        <div className={itemDetailsStyle}>{details}</div>
      </>
    ),
    [children, details, icon],
  );

  return (
    <ViewTransition name={id} default={transitionClassFor(regionOf(id))}>
      <div className={itemClassNames} {...props}>
        {onClick && (
          <button type="button" className={itemStyle} onClick={onClick}>
            {content}
          </button>
        )}
        {url && !onClick && (
          <a className={itemStyle} href={url}>
            {content}
          </a>
        )}
        {(settings?.contextMenus === "contextMenuOptionBoth" ||
          settings?.contextMenus === "contextMenuOptionDisplayed") && (
          <FloatingMenuButton dragId={id} className={itemActionsStyle}>
            <TiThMenu />
          </FloatingMenuButton>
        )}
      </div>
    </ViewTransition>
  );
};
