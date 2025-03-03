import { FC, PropsWithChildren, ReactNode } from "react";
import {
  folderStyle,
  folderHeadingStyle,
  folderHeaderWrapperStyles,
  folderContentStyle,
  folderIndicatorStyle,
  folderContentWrapperStyle,
  folderSubHeadingStyle,
} from "./folder.css";
import { Flipped } from "react-flip-toolkit";
import { bookmarksStyle } from "../bookmark/bookmarks.css";
import { useDragContext } from "../drag/dragContext";
import { useConditionalClassNames } from "../../util/useConditionalClassNames";
import { DragId } from "../drag/dragContext.util";

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
  const folderClassNames = useConditionalClassNames(
    {
      dragging: () => dragState.sourceIds.has(id),
      expanded: () => isOpen ?? false,
    },
    folderStyle,
  );

  return (
    <div className={folderClassNames} draggable data-container {...props}>
      <header onClick={onClick} className={folderHeaderWrapperStyles}>
        <Flipped flipId={`title-${id}`}>
          <div className={folderHeadingStyle}>
            {title}
            {detail && <span className={folderSubHeadingStyle}>{detail}</span>}
          </div>
        </Flipped>
        <Flipped flipId={`indicator-${id}`}>
          <div className={folderIndicatorStyle} />
        </Flipped>
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
