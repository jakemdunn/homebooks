import { FC, PropsWithChildren, ReactNode, ViewTransition } from "react";
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
          <ViewTransition name={`title-${id}`}>
            <div className={folderHeadingStyle}>
              {title}
              {detail && (
                <span className={folderSubHeadingStyle}>{detail}</span>
              )}
            </div>
          </ViewTransition>
          <ViewTransition name={`indicator-${id}`}>
            <div className={folderIndicatorStyle} />
          </ViewTransition>
        </div>
        {(settings?.contextMenus === "contextMenuOptionBoth" ||
          settings?.contextMenus === "contextMenuOptionDisplayed") && (
          <ViewTransition name={`folder-context-menu-${id}`}>
            <div>
              <FloatingMenuButton dragId={id} className={folderActionsStyle}>
                <TiThMenu />
              </FloatingMenuButton>
            </div>
          </ViewTransition>
        )}
      </header>
      <ViewTransition name={`background-${id}`}>
        <div className={folderContentStyle} />
      </ViewTransition>
      <ViewTransition name={`contents-${id}`}>
        <div className={folderContentWrapperStyle}>
          <section className={bookmarksStyle} data-grid-container>
            {isOpen ? children : null}
          </section>
        </div>
      </ViewTransition>
    </div>
  );
};
