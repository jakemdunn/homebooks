import { FC, useCallback, useEffect, useState } from "react";
import browser from "webextension-polyfill";
import {
  CreateItemForm,
  type CreateItemFormValues,
} from "../components/createItem/createItemForm";
import { buttonPrimaryStyle } from "../components/createItem/createItemForm.css";
import { useRootFolder } from "../util/rootFolder.context";
import { useI18n } from "../util/i18n";
import { isExtensionOrBrowserInternalUrl } from "../util/restrictedTabUrl";
import { openHomeBooksWithSettingsPanel } from "../util/openHomeBooksAndSettings";
import {
  popupAboutBlockStyle,
  popupAboutHeadingStyle,
  popupAboutTextStyle,
  popupBodyStyle,
  popupHeadingStyle,
  popupLoadingRootStyle,
  popupRootStyle,
  popupSettingsButtonStyle,
  popupVersionRowStyle,
} from "./Popup.css";

const Popup: FC = () => {
  const t = useI18n();
  const rootFolder = useRootFolder();
  const [tabDefaults, setTabDefaults] = useState<{
    title: string;
    url: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      const tab = tabs[0];
      if (cancelled) return;
      setTabDefaults({
        title: tab?.title ?? "",
        url: tab?.url ?? "",
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onOpenSettings = useCallback(async () => {
    try {
      await openHomeBooksWithSettingsPanel();
    } catch (e) {
      console.error(e);
    }
    window.close();
  }, []);

  if (tabDefaults === null || rootFolder === undefined) {
    return (
      <div className={popupLoadingRootStyle} aria-busy="true">
        {t("popupLoading")}
      </div>
    );
  }

  const restricted = isExtensionOrBrowserInternalUrl(tabDefaults.url);

  if (restricted) {
    const version = browser.runtime.getManifest().version ?? "";

    return (
      <div className={popupRootStyle}>
        <h1 className={popupHeadingStyle}>{t("popupRestrictedTitle")}</h1>
        <p className={popupBodyStyle}>{t("popupRestrictedExplanation")}</p>
        <p className={popupVersionRowStyle}>
          {t("popupVersionLabel")} {version}
        </p>
        <div className={popupAboutBlockStyle}>
          <h2 className={popupAboutHeadingStyle}>{t("popupAboutHeading")}</h2>
          <p className={popupAboutTextStyle}>{t("extensionDescription")}</p>
        </div>
        <button
          type="button"
          className={`${buttonPrimaryStyle} ${popupSettingsButtonStyle}`}
          onClick={onOpenSettings}
        >
          {t("popupOpenSettings")}
        </button>
      </div>
    );
  }

  const initialValues: CreateItemFormValues = {
    parentId: rootFolder,
    title: tabDefaults.title,
    url: tabDefaults.url,
  };

  return (
    <div className={popupRootStyle}>
      <h1 className={popupHeadingStyle}>{t("popupAddBookmarkTitle")}</h1>
      <CreateItemForm
        initialValues={initialValues}
        mode="bookmark"
        onSuccess={() => {
          window.close();
        }}
      />
    </div>
  );
};

export default Popup;
