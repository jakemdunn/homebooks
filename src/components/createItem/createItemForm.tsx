import { FC, useMemo } from "react";
import { ErrorMessage, Field, Form, Formik, type FormikHelpers } from "formik";
import * as yup from "yup";
import browser from "webextension-polyfill";
import { FolderSelect } from "../form/folder/folderSelect";
import { useI18n } from "../../util/i18n";
import {
  actionsStyle,
  buttonPrimaryStyle,
  buttonSecondaryStyle,
  fieldErrorStyle,
  fieldGroupStyle,
  folderSelectWrapStyle,
  formStyle,
  globalErrorStyle,
  inputStyle,
  labelStyle,
} from "./createItemForm.css";

export type CreateItemMode = "bookmark" | "folder";

export type CreateItemFormValues = {
  title: string;
  url: string;
  parentId: string;
};

export interface CreateItemFormProps {
  mode: CreateItemMode;
  initialValues: CreateItemFormValues;
  onSuccess: () => void;
  onCancel?: () => void;
}

function bookmarkSchema(t: ReturnType<typeof useI18n>) {
  return yup.object({
    parentId: yup.string().required(t("createFormParentRequired")),
    title: yup.string().trim().required(t("createFormTitleRequired")),
    url: yup
      .string()
      .trim()
      .required(t("createFormUrlRequired"))
      .test("url", t("createFormUrlInvalid"), (v) => {
        if (!v?.length) return false;
        try {
          new URL(v);
          return true;
        } catch {
          return false;
        }
      }),
  });
}

function folderSchema(t: ReturnType<typeof useI18n>) {
  return yup.object({
    parentId: yup.string().required(t("createFormParentRequired")),
    title: yup.string().trim().required(t("createFormTitleRequired")),
    url: yup.string(),
  });
}

export const CreateItemForm: FC<CreateItemFormProps> = ({
  initialValues,
  mode,
  onCancel,
  onSuccess,
}) => {
  const t = useI18n();
  const validationSchema = useMemo(
    () => (mode === "bookmark" ? bookmarkSchema(t) : folderSchema(t)),
    [mode, t],
  );

  const onSubmit = async (
    values: CreateItemFormValues,
    { setSubmitting }: FormikHelpers<CreateItemFormValues>,
  ) => {
    try {
      if (mode === "bookmark") {
        await browser.bookmarks.create({
          index: 0,
          parentId: values.parentId,
          title: values.title.trim(),
          url: values.url.trim(),
        });
      } else {
        await browser.bookmarks.create({
          index: 0,
          parentId: values.parentId,
          title: values.title.trim(),
        });
      }
      onSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik<CreateItemFormValues>
      initialValues={initialValues}
      validationSchema={validationSchema}
      validateOnBlur
      validateOnChange={false}
      enableReinitialize
      onSubmit={onSubmit}
    >
      {({ isSubmitting, submitCount, errors }) => (
        <Form className={formStyle} noValidate>
          {submitCount > 0 && Object.keys(errors).length > 0 ? (
            <p className={globalErrorStyle} role="alert">
              {t("createFormGlobalError")}
            </p>
          ) : null}

          <div className={fieldGroupStyle}>
            <label className={labelStyle} htmlFor="create-item-title">
              {t("createFormTitleLabel")}
            </label>
            <Field
              id="create-item-title"
              name="title"
              type="text"
              autoComplete="off"
              className={inputStyle}
            />
            <ErrorMessage
              name="title"
              component="span"
              className={fieldErrorStyle}
            />
          </div>

          {mode === "bookmark" ? (
            <div className={fieldGroupStyle}>
              <label className={labelStyle} htmlFor="create-item-url">
                {t("createFormUrlLabel")}
              </label>
              <Field
                id="create-item-url"
                name="url"
                type="url"
                autoComplete="off"
                className={inputStyle}
              />
              <ErrorMessage
                name="url"
                component="span"
                className={fieldErrorStyle}
              />
            </div>
          ) : null}

          <div className={fieldGroupStyle}>
            <span className={labelStyle} id="create-item-parent-label">
              {t("createFormParentLabel")}
            </span>
            <div
              className={folderSelectWrapStyle}
              aria-labelledby="create-item-parent-label"
            >
              <FolderSelect
                id="create-item-parent"
                name="parentId"
                underHomebooksRoot
              />
            </div>
            <ErrorMessage
              name="parentId"
              component="span"
              className={fieldErrorStyle}
            />
          </div>

          <div className={actionsStyle}>
            <button
              type="submit"
              className={buttonPrimaryStyle}
              disabled={isSubmitting}
            >
              {t("createFormSubmit")}
            </button>
            {onCancel ? (
              <button
                type="button"
                className={buttonSecondaryStyle}
                disabled={isSubmitting}
                onClick={onCancel}
              >
                {t("createFormCancel")}
              </button>
            ) : null}
          </div>
        </Form>
      )}
    </Formik>
  );
};
