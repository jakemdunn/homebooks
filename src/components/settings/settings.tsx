import { FC, PropsWithChildren, useEffect, useState } from "react";
import { RiSettings4Fill } from "react-icons/ri";
import HomeBooksIcon from "/icon/homebooks.svg?url";
import * as i18nMessages from "../../../public/_locales/en/messages.json";
import {
  headerStyle,
  headerIconStyle,
  settingsButtonStyle,
  settingsPanelStyle,
  settingsContentStyle,
} from "./settings.css";
import { useConditionalClassNames } from "../../util/useConditionalClassNames";
import { useStorage } from "../../util/useStorage";
import { Field, Form, Formik } from "formik";
import { useI18n } from "../../util/i18n";
import { FolderSelect } from "../form/folder/folderSelect";

type ContextMenuOption = Extract<
  keyof typeof i18nMessages,
  | "contextMenuOptionBoth"
  | "contextMenuOptionDisplayed"
  | "contextMenuOptionRightClick"
>;
export interface SettingsData {
  rootFolder: string;
  contextMenus: ContextMenuOption;
}

const CONTEXT_MENU_OPTIONS: ContextMenuOption[] = [
  "contextMenuOptionBoth",
  "contextMenuOptionDisplayed",
  "contextMenuOptionRightClick",
];
const DEFAULT_SETTINGS: SettingsData = {
  rootFolder: "menu________",
  contextMenus: "contextMenuOptionBoth",
};

export const useSettingsStorage = () => useStorage(DEFAULT_SETTINGS);

const SettingsUpdate: FC<{ values: SettingsData }> = ({ values }) => {
  const [settings, setSettingsData] = useSettingsStorage();
  useEffect(() => {
    if (JSON.stringify(values) === JSON.stringify(settings)) return;
    setSettingsData(values);
  }, [setSettingsData, settings, values]);
  return null;
};

export const Settings: FC<
  PropsWithChildren<
    React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
  >
> = ({ children, ...props }) => {
  const [open, setOpen] = useState(false);
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
      console.log(event, (event.target as Element).closest("[data-settings]"));
      if (!(event.target as Element).closest("[data-settings]")) {
        setOpen(false);
      }
    };
    const escapeListener = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("click", clickListener);
    document.addEventListener("keydown", escapeListener);
    return () => {
      document.removeEventListener("click", clickListener);
      document.removeEventListener("keydown", escapeListener);
    };
  }, [open]);

  const [settingsData, setSettingsData] = useSettingsStorage();
  const i18n = useI18n();

  return (
    <main {...props}>
      <header>
        <h1 className={headerStyle}>
          <img className={headerIconStyle} src={HomeBooksIcon} /> HomeBooks
          <button
            type="button"
            className={settingsButtonStyle}
            onClick={() => setOpen((prev) => !prev)}
            data-settings
          >
            <RiSettings4Fill />
          </button>
        </h1>
      </header>
      <section className={classNames} data-settings>
        <div className={settingsContentStyle}>
          <h2>Settings</h2>
          {settingsData && (
            <Formik<SettingsData>
              initialValues={settingsData}
              onSubmit={setSettingsData}
            >
              {({ values }) => (
                <Form>
                  <SettingsUpdate values={values} />
                  <p>
                    <label htmlFor="contextMenus">
                      {i18n("contextMenuLabel")}
                    </label>
                    <Field id="contextMenus" name="contextMenus" as="select">
                      {CONTEXT_MENU_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {i18n(option)}
                        </option>
                      ))}
                    </Field>
                  </p>
                  <p>
                    <label htmlFor="rootFolder">
                      {i18n("rootFolderLabel")}
                    </label>
                    <FolderSelect id="rootFolder" name="rootFolder" />
                  </p>
                </Form>
              )}
            </Formik>
          )}
        </div>
      </section>
      {children}
    </main>
  );
};
