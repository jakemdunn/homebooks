import { FC } from "react";
import { FaRegFolderOpen } from "react-icons/fa6";
import { useModalsContext } from "../modals/modals.context";
import { useI18n } from "../../util/i18n";
import {
  contentEmptyIconStyle,
  contentEmptyStateStyle,
  contentEmptyTextStyle,
  folderEmptyLinkStyle,
} from "./bookmarks.css";

export const BookmarkFolderEmptyState: FC<{ folderId: string }> = ({
  folderId,
}) => {
  const { openNewBookmarkModal } = useModalsContext();
  const t = useI18n();

  return (
    <div className={contentEmptyStateStyle}>
      <FaRegFolderOpen className={contentEmptyIconStyle} aria-hidden />
      <p className={contentEmptyTextStyle}>
        {t("folderEmptyBody", {
          createLink: (
            <button
              type="button"
              className={folderEmptyLinkStyle}
              onClick={() => openNewBookmarkModal({ parentId: folderId })}
            >
              {t("folderEmptyCreateLink")}
            </button>
          ),
        })}
      </p>
    </div>
  );
};
