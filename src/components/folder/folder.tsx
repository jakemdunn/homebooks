import { FC, PropsWithChildren, ReactNode } from "react";
import {
  folderStyle,
  folderHeadingStyle,
  folderHeaderWrapperStyles,
  folderContentStyle,
  folderIndicatorStyle,
  folderContentWrapperStyle,
  folderSubHeadingStyle,
  folderActionsStyle,
  folderHeaderStyles,
} from "./folder.css";
import { Flipped } from "react-flip-toolkit";
import { bookmarksStyle } from "../bookmark/bookmarks.css";
import { useConditionalClassNames } from "../../util/useConditionalClassNames";
import { DragId } from "../drag/dragProvider.util";
import { useDragContext } from "../drag/dragContext";
import { useSettingsStorage } from "../../util/storage.types";
import { TiThMenu } from "react-icons/ti";
import { FloatingMenuButton } from "../floatingMenu/floatingMenuButton";

export interface FolderProps
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > {
  id: DragId;
  isOpen?: boolean;
  detail?: ReactNode;
}

export const Folder: FC<PropsWithChildren<FolderProps>> = ({
  id,
  title,
  isOpen,
  onClick,
  children,
  detail,
  ...props
}) => {
  const dragState = useDragContext();
  const [settings] = useSettingsStorage();
  const folderClassNames = useConditionalClassNames(
    {
      dragging: () => dragState.sourceIds.has(id),
      expanded: () => isOpen ?? false,
    },
    folderStyle
  );

  return (
    <div className={folderClassNames} draggable data-container {...props}>
      <header className={folderHeaderWrapperStyles}>
        <div className={folderHeaderStyles} onClick={onClick}>
          <Flipped flipId={`title-${id}`}>
            <div className={folderHeadingStyle}>
              {title}
              {detail && (
                <span className={folderSubHeadingStyle}>{detail}</span>
              )}
            </div>
          </Flipped>
          <Flipped flipId={`indicator-${id}`}>
            <div className={folderIndicatorStyle} />
          </Flipped>
        </div>
        {(settings?.contextMenus === "contextMenuOptionBoth" ||
          settings?.contextMenus === "contextMenuOptionDisplayed") && (
          <Flipped flipId={`folder-context-menu-${id}`}>
            <div>
              <FloatingMenuButton dragId={id} className={folderActionsStyle}>
                <TiThMenu />
              </FloatingMenuButton>
            </div>
          </Flipped>
        )}
      </header>
      <Flipped flipId={`background-${id}`}>
        <div className={folderContentStyle} />
      </Flipped>
      <Flipped flipId={`contents-${id}`}>
        <div className={folderContentWrapperStyle}>
          <Flipped inverseFlipId={`contents-${id}`}>
            <section className={bookmarksStyle} data-grid-container>
              {children}
            </section>
          </Flipped>
        </div>
      </Flipped>
    </div>
  );
};
