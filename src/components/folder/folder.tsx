import { FC, PropsWithChildren, ReactNode, ViewTransition } from "react";
import {
  folderStyle,
  folderHeadingStyle,
  folderHeaderWrapperStyles,
  folderContentStyle,
  folderContentWrapperStyle,
  folderSubHeadingStyle,
  folderActionsStyle,
  folderHeaderStyles,
  folderIndicatorStyle,
} from "./folder.css";
import { bookmarksStyle } from "../bookmark/bookmarks.css";
import { useConditionalClassNames } from "../../util/useConditionalClassNames";
import { DragId } from "../drag/dragProvider.util";
import { useDragContext } from "../drag/dragContext";
import { useSettingsStorage } from "../../util/storage.types";
import { FaRegWindowMaximize, FaRegWindowRestore } from "react-icons/fa6";
import { FaRegFolder, FaRegFolderOpen } from "react-icons/fa6";
import { TiThMenu } from "react-icons/ti";
import { FloatingMenuButton } from "../floatingMenu/floatingMenuButton";

export type FolderType = "bookmark" | "window";

export interface FolderProps
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > {
  id: DragId;
  type?: FolderType;
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
  type = "bookmark",
  ...props
}) => {
  const dragState = useDragContext();
  const [settings] = useSettingsStorage();
  const folderClassNames = useConditionalClassNames(
    {
      dragging: () => dragState.sourceIds.has(id),
      expanded: () => isOpen ?? false,
    },
    folderStyle,
  );

  return (
    <ViewTransition name={`folder-${id}`}>
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
              <div className={folderIndicatorStyle}>
                {type === "window" &&
                  (isOpen ? <FaRegWindowRestore /> : <FaRegWindowMaximize />)}
                {type === "bookmark" &&
                  (isOpen ? <FaRegFolderOpen /> : <FaRegFolder />)}
              </div>
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
        {isOpen && (
          <ViewTransition
            name={`contents-${id}`}
            enter="folder-appear"
            exit="folder-disappear"
          >
            <div className={folderContentWrapperStyle}>
              <section className={bookmarksStyle} data-grid-container>
                {children}
              </section>
            </div>
          </ViewTransition>
        )}
      </div>
    </ViewTransition>
  );
};
