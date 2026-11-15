import { useCallback, useState } from "react";
import browser from "webextension-polyfill";
import { useSettingsStorage } from "./storage.types";
import { parseTobyExport, type TobyImportNode } from "./tobyExport";

const countNodes = (nodes: TobyImportNode[]): number =>
  nodes.reduce(
    (count, node) =>
      count + 1 + ("children" in node ? countNodes(node.children) : 0),
    0,
  );

const createNodes = async (
  nodes: TobyImportNode[],
  parentId: string,
  onCreated: () => void,
) => {
  for (const node of nodes) {
    const created = await browser.bookmarks.create({
      parentId,
      title: node.title,
      ...("url" in node && { url: node.url }),
    });
    onCreated();
    if ("children" in node)
      await createNodes(node.children, created.id, onCreated);
  }
};

export const useTobyImport = () => {
  const [settings] = useSettingsStorage();
  const [progress, setProgress] = useState(0);
  const parseToby = useCallback(
    async (tobyExport: object) => {
      if (!settings?.rootFolder) throw new Error("Root folder not selected.");
      return await parseTobyExport(tobyExport);
    },
    [settings?.rootFolder],
  );
  const importToby = useCallback(
    async (imports: TobyImportNode[]) => {
      if (!settings?.rootFolder) throw new Error("Root folder not selected.");

      const totalOps = countNodes(imports);
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
        await createNodes(imports, settings.rootFolder, bumpProgress);
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
