import {
  FC,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
} from "react";
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
import { FileInput } from "../form/fileInput/fileInput";
import { FolderSelect } from "../form/folder/folderSelect";
import {
  CONTEXT_MENU_OPTIONS,
  SettingsData,
  areSettingsEqual,
  normalizeSettings,
  useSettingsStorage,
} from "../../util/storage.types";
import { useStorage } from "../../util/useStorage";
import {
  SETTINGS_PANEL_VISIBLE,
} from "./settings.util";
import { useTobyImport } from "../../util/toby.import";

const SettingsUpdate: FC<{ values: SettingsData }> = ({ values }) => {
  const [settings, setSettingsData] = useSettingsStorage();
  const normalized = useMemo(
    () => normalizeSettings(values),
    [values]
  );
  useEffect(() => {
    if (areSettingsEqual(normalized, settings)) return;
    setSettingsData(normalized);
  }, [normalized, settings, setSettingsData]);
  return null;
};

export const Settings: FC<PropsWithChildren> = ({ children }) => {
  const [{ [SETTINGS_PANEL_VISIBLE]: open }, setOpen] = useStorage<{
    [SETTINGS_PANEL_VISIBLE]: boolean;
  }>(SETTINGS_PANEL_VISIBLE, "session");
  const tobyImport = useTobyImport();
  const selectFile = useCallback(
    async (
      event: React.ChangeEvent<HTMLInputElement>,
    ) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const imports = await tobyImport.parseToby(
          JSON.parse(await file.text())
        );
        await tobyImport.importToby(imports);
      } catch (error) {
        console.error(error);
      }
    },
    [tobyImport]
  );
  const classNames = useConditionalClassNames(
    {
      open: () => !!open,
    },
    settingsPanelStyle
  );
  useEffect(() => {
    document.documentElement.classList.toggle(SETTINGS_PANEL_VISIBLE, !!open);
  }, [open]);

  useEffect(() => {
    return () => {
      document.documentElement.classList.remove(SETTINGS_PANEL_VISIBLE);
    };
  }, []);

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
          <span><img className={headerIconStyle} src={HomeBooksIcon} />HomeBooks</span>
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
          {Object.keys(settingsData).length > 0 && (
            <Formik<SettingsData>
              initialValues={settingsData}
              enableReinitialize
              onSubmit={(values) => setSettingsData(normalizeSettings(values))}
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
                  <FileInput
                    onChange={selectFile}
                    accept="application/json,.json"
                  >
                    {i18n("importFromToby")}
                  </FileInput>
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
