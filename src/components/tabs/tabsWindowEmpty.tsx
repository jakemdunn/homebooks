import { FC } from "react";
import { PiBrowsers } from "react-icons/pi";
import { useI18n } from "../../util/i18n";
import {
  contentEmptyIconStyle,
  contentEmptyStateStyle,
  contentEmptyTextStyle,
} from "../bookmark/bookmarks.css";

export const TabsWindowEmpty: FC = () => {
  const t = useI18n();

  return (
    <div className={contentEmptyStateStyle}>
      <PiBrowsers className={contentEmptyIconStyle} aria-hidden />
      <p className={contentEmptyTextStyle}>{t("tabsWindowNoValidTabs")}</p>
    </div>
  );
};
