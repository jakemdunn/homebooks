import { FC, PropsWithChildren, useEffect } from "react";
import { RiSettings4Fill } from "react-icons/ri";
import HomeBooksIcon from "/icon/homebooks.svg?url";
import {
  headerStyle,
  headerIconStyle,
  settingsButtonStyle,
  settingsPanelStyle,
  settingsContentStyle,
  selectStyle,
  settingsFormStyle,
  settingsHeaderStyle,
} from "./settings.css";
import { useConditionalClassNames } from "../../util/useConditionalClassNames";
import { Field, Form, Formik } from "formik";
import { useI18n } from "../../util/i18n";
import { FolderSelect } from "../form/folder/folderSelect";
import {
  ContextMenuOption,
  SettingsData,
  useSettingsStorage,
} from "../../util/storage.types";
import { useStorage } from "../../util/useStorage";
import { SETTINGS_PANEL_VISIBLE } from "./settings.util";

const CONTEXT_MENU_OPTIONS: ContextMenuOption[] = [
  "contextMenuOptionBoth",
  "contextMenuOptionDisplayed",
  "contextMenuOptionRightClick",
];

const SettingsUpdate: FC<{ values: SettingsData }> = ({ values }) => {
  const [settings, setSettingsData] = useSettingsStorage();
  useEffect(() => {
    if (JSON.stringify(values) === JSON.stringify(settings)) return;
    setSettingsData(values);
  }, [setSettingsData, settings, values]);
  return null;
};

export const Settings: FC<PropsWithChildren> = ({ children }) => {
  const [{ [SETTINGS_PANEL_VISIBLE]: open }, setOpen] = useStorage<{
    [SETTINGS_PANEL_VISIBLE]: boolean;
  }>(SETTINGS_PANEL_VISIBLE, "session");
  const classNames = useConditionalClassNames(
    {
      open: () => !!open,
    },
    settingsPanelStyle
  );
  useEffect(() => {
    if (!open) return;

    const clickListener = (event: Event) => {
      if (!(event.target as Element).closest("body")) {
        return;
      }
      if (!(event.target as Element).closest("[data-settings]")) {
        setOpen({ [SETTINGS_PANEL_VISIBLE]: false });
      }
    };
    const escapeListener = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen({ [SETTINGS_PANEL_VISIBLE]: false });
      }
    };
    document.addEventListener("click", clickListener);
    document.addEventListener("keydown", escapeListener);
    return () => {
      document.removeEventListener("click", clickListener);
      document.removeEventListener("keydown", escapeListener);
    };
  }, [open, setOpen]);

  const [settingsData, setSettingsData] = useSettingsStorage();
  const i18n = useI18n();

  return (
    <>
      <header>
        <h1 className={headerStyle}>
          <img className={headerIconStyle} src={HomeBooksIcon} /> HomeBooks
          <button
            type="button"
            className={settingsButtonStyle}
            onClick={() => setOpen({ [SETTINGS_PANEL_VISIBLE]: !open })}
            data-settings
          >
            <RiSettings4Fill />
          </button>
        </h1>
      </header>
      <section className={classNames} data-settings inert={!open}>
        <div className={settingsContentStyle}>
          <h2 className={settingsHeaderStyle}>Settings</h2>
          {settingsData && (
            <Formik<SettingsData>
              initialValues={settingsData}
              onSubmit={setSettingsData}
            >
              {({ values }) => (
                <Form className={settingsFormStyle}>
                  <SettingsUpdate values={values} />
                  <div>
                    <label htmlFor="contextMenus">
                      {i18n("contextMenuLabel")}
                    </label>
                    <Field
                      id="contextMenus"
                      name="contextMenus"
                      as="select"
                      className={selectStyle}
                    >
                      {CONTEXT_MENU_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {i18n(option)}
                        </option>
                      ))}
                    </Field>
                  </div>
                  <div>
                    <label htmlFor="rootFolder">
                      {i18n("rootFolderLabel")}
                    </label>
                    <FolderSelect id="rootFolder" name="rootFolder" />
                  </div>
                </Form>
              )}
            </Formik>
          )}
        </div>
      </section>
      <div inert={open}>{children}</div>
    </>
  );
};
