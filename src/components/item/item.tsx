import { FC, PropsWithChildren, ReactNode, useMemo } from "react";
import { Flipped } from "react-flip-toolkit";
import {
  itemWrapperStyle,
  itemStyle,
  itemTitleStyle,
  itemDetailsStyle,
  itemContent,
  itemImageStyle,
  itemActionsStyle,
} from "./item.css";
import { useDragContext } from "../drag/dragContext";
import { useConditionalClassNames } from "../../util/useConditionalClassNames";
import { DragId } from "../drag/dragContext.util";
import { TiThMenu } from "react-icons/ti";
import { FloatingMenuButton } from "../floatingMenu/floatingMenuButton";
import { useSettingsStorage } from "../settings/settings";

export type ItemProps = Omit<
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>,
  "ref"
> & {
  id: DragId;
  details: ReactNode;
  favicon: string;
  url?: string;
};

export const Item: FC<PropsWithChildren<ItemProps>> = ({
  children,
  details,
  id,
  favicon,
  onClick,
  url,
  ...props
}) => {
  // TODO: Only scale title if it's a double line on hover
  const dragState = useDragContext();
  const [settings] = useSettingsStorage();
  const itemClassNames = useConditionalClassNames(
    {
      dragging: () => dragState.sourceIds.has(id),
    },
    itemWrapperStyle
  );
  const content = useMemo(
    () => (
      <>
        <span className={itemContent}>
          <img
            className={itemImageStyle}
            src={favicon}
            width={32}
            height={32}
          />
          <span className={itemTitleStyle}>{children}</span>
        </span>
        <div className={itemDetailsStyle}>{details}</div>
      </>
    ),
    [children, details, favicon]
  );

  return (
    <Flipped flipId={id}>
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
    </Flipped>
  );
};
