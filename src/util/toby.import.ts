import { useCallback, useState } from "react";
import { array, number, object, string } from "yup";
import browser from "webextension-polyfill";
import { useSettingsStorage } from "./storage.types";

export const tobySchema = object({
  version: number()
    .required()
    .test(
      "v3",
      () => "Not a v3 toby import.",
      (value) => value === 3,
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
        }),
      ),
      labels: array().of(string()),
    }),
  ),
});

export const useTobyImport = () => {
  const [settings] = useSettingsStorage();
  const [progress, setProgress] = useState(0);
  const parseToby = useCallback(
    async (tobyExport: object) => {
      if (!settings?.rootFolder) throw new Error("Root folder not selected.");
      return await tobySchema.validate(tobyExport);
    },
    [settings?.rootFolder],
  );
  const importToby = useCallback(
    async (imports: Awaited<ReturnType<typeof parseToby>>) => {
      if (!settings?.rootFolder) throw new Error("Root folder not selected.");

      const lists = imports.lists ?? [];
      const totalOps = lists.reduce(
        (acc, list) => acc + 1 + (list.cards?.length ?? 0),
        0,
      );

      if (totalOps === 0) {
        setProgress(100);
        return;
      }

      setProgress(0);
      let done = 0;
      const bumpProgress = () => {
        done += 1;
        setProgress(Math.min(100, Math.round((done / totalOps) * 100)));
      };

      try {
        for (const list of lists) {
          const folder = await browser.bookmarks.create({
            title: list.title,
            parentId: settings.rootFolder,
          });
          bumpProgress();
          for (const card of list.cards ?? []) {
            await browser.bookmarks.create({
              title: card.title,
              url: card.url,
              parentId: folder.id,
            });
            bumpProgress();
          }
        }
        setProgress(100);
        setTimeout(() => setProgress(0), 1000);
      } catch (error) {
        setProgress(0);
        throw error;
      }
    },
    [settings?.rootFolder],
  );
  return { parseToby, importToby, progress };
};
