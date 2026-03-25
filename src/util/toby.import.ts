import { useCallback } from "react";
import { array, number, object, string } from "yup";
import browser from "webextension-polyfill";
import { useSettingsStorage } from "./storage.types";

export const tobySchema = object({
  version: number()
    .required()
    .test(
      "v3",
      () => "Not a v3 toby import.",
      (value) => value === 3
    ),
  lists: array().of(
    object({
      title: string().required(),
      cards: array().of(
        object({
          title: string().required(),
          url: string().required(),
          customTitle: string(),
          customDescription: string(),
        })
      ),
      labels: array().of(string()),
    })
  ),
});

export const useTobyImport = () => {
  const [settings] = useSettingsStorage();
  console.log("settings", settings?.rootFolder);
  const parseToby = useCallback(
    async (tobyExport: object) => {
      if (!settings?.rootFolder) throw new Error("Root folder not selected.");
      return await tobySchema.validate(tobyExport);
    },
    [settings?.rootFolder]
  );
  const importToby = useCallback(
    async (
      imports: Awaited<ReturnType<typeof parseToby>>,
    ) => {
      if (!settings?.rootFolder) throw new Error("Root folder not selected.");

      for (const list of imports.lists ?? []) {
        const folder = await browser.bookmarks.create({
          title: list.title,
          parentId: settings?.rootFolder,
        });
        console.log("created folder", folder);
        for (const card of list.cards ?? []) {
          const bookmark = await browser.bookmarks.create({
            title: card.title,
            url: card.url,
            parentId: folder.id,
          });
          console.log("created bookmark", bookmark);
        }
      }
    },
    [settings?.rootFolder]
  );
  return { parseToby, importToby };
};
