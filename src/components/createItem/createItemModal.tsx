import { FC, useEffect } from "react";
import { FloatingPortal } from "@floating-ui/react";
import { useModalsContext } from "../modals/modals.context";
import { CreateItemForm, type CreateItemFormValues } from "./createItemForm";
import { dialogStyle, overlayStyle, titleStyle } from "./createItemModal.css";
import { useI18n } from "../../util/i18n";

export const CreateItemModal: FC = () => {
  const { closeCreateModal, createModal } = useModalsContext();
  const t = useI18n();

  useEffect(() => {
    if (!createModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCreateModal();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeCreateModal, createModal]);

  if (!createModal) return null;

  const initialValues: CreateItemFormValues = {
    parentId: createModal.defaults.parentId ?? "",
    title: createModal.defaults.title ?? "",
    url:
      createModal.kind === "bookmark"
        ? (createModal.defaults.url ?? "")
        : "",
  };

  return (
    <FloatingPortal>
      <div
        className={overlayStyle}
        role="presentation"
        onClick={closeCreateModal}
      >
        <div
          className={dialogStyle}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-item-modal-title"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 id="create-item-modal-title" className={titleStyle}>
            {createModal.kind === "bookmark"
              ? t("createItemModalTitleBookmark")
              : t("createItemModalTitleFolder")}
          </h2>
          <CreateItemForm
            initialValues={initialValues}
            mode={createModal.kind}
            onCancel={closeCreateModal}
            onSuccess={closeCreateModal}
          />
        </div>
      </div>
    </FloatingPortal>
  );
};
