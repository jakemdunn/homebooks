import { FC, PropsWithChildren, useCallback, useEffect } from "react";
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
import { Field, Form, Formik, useFormikContext } from "formik";
import { useI18n } from "../../util/i18n";
import { FileInput } from "../form/fileInput/fileInput";
import { FolderSelect } from "../form/folder/folderSelect";
import {
  CONTEXT_MENU_OPTIONS,
  SettingsData,
  normalizeSettings,
  useSettingsStorage,
} from "../../util/storage.types";
import { useStorage } from "../../util/useStorage";
import { SETTINGS_PANEL_VISIBLE } from "./settings.util";
import { useTobyImport } from "../../util/toby.import";
import equal from "fast-deep-equal";

const SettingsUpdate: FC = () => {
  const { values, initialValues, submitForm } =
    useFormikContext<SettingsData>();
  useEffect(() => {
    if (!equal(values, initialValues)) {
      submitForm();
    }
  }, [values, initialValues, submitForm]);
  return null;
};

export const Settings: FC<PropsWithChildren> = ({ children }) => {
  const [open, setOpen] = useStorage<boolean>(
    SETTINGS_PANEL_VISIBLE,
    false,
    "session",
  );
  const tobyImport = useTobyImport();
  const selectFile = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const imports = await tobyImport.parseToby(
          JSON.parse(await file.text()),
        );
        await tobyImport.importToby(imports);
      } catch (error) {
        console.error(error);
      }
    },
    [tobyImport],
  );
  const classNames = useConditionalClassNames(
    {
      open: () => !!open,
    },
    settingsPanelStyle,
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
  }, [open, setOpen]);

  const [settingsData, setSettingsData] = useSettingsStorage();
  const i18n = useI18n();

  return (
    <>
      <header>
        <h1 className={headerStyle}>
          <span>
            <img className={headerIconStyle} src={HomeBooksIcon} />
            HomeBooks
          </span>
          <button
            type="button"
            className={settingsButtonStyle}
            onClick={() => setOpen(!open)}
            data-settings
          >
            <RiSettings4Fill />
          </button>
        </h1>
      </header>
      <section className={classNames} data-settings inert={!open}>
        <div className={settingsContentStyle}>
          <h2 className={settingsHeaderStyle}>Settings</h2>
          <Formik<SettingsData>
            initialValues={settingsData}
            enableReinitialize
            onSubmit={(values) => setSettingsData(normalizeSettings(values))}
          >
            {() => (
              <Form className={settingsFormStyle}>
                <SettingsUpdate />
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
                  <label htmlFor="rootFolder">{i18n("rootFolderLabel")}</label>
                  <FolderSelect id="rootFolder" name="rootFolder" />
                </div>
                <FileInput
                  onChange={selectFile}
                  accept="application/json,.json"
                  progress={tobyImport.progress}
                >
                  {i18n("importFromToby")}
                </FileInput>
              </Form>
            )}
          </Formik>
        </div>
      </section>
      <div inert={open}>{children}</div>
    </>
  );
};
