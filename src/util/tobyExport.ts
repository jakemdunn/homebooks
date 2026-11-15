import { array, number, object, string, type InferType } from "yup";

/** What a Toby export becomes: Folders of Bookmarks, created under the Root Folder. */
export type TobyImportNode =
  | { title: string; url: string }
  | { title: string; children: TobyImportNode[] };

const cardSchema = object({
  title: string().required(),
  url: string().required(),
  customTitle: string(),
});

const listSchema = object({
  title: string().required(),
  cards: array().of(cardSchema).default([]),
});

const v3Schema = object({
  lists: array().of(listSchema).default([]),
});

const v4Schema = object({
  groups: array()
    .of(
      object({
        name: string().required(),
        lists: array().of(listSchema).default([]),
      }),
    )
    .default([]),
});

type TobyList = InferType<typeof listSchema>;

const toBookmark = (card: InferType<typeof cardSchema>): TobyImportNode => ({
  title: card.customTitle || card.title,
  url: card.url,
});

const toFolder = (list: TobyList): TobyImportNode => ({
  title: list.title,
  children: list.cards.map(toBookmark),
});

const fromV3 = async (tobyExport: unknown) =>
  (await v3Schema.validate(tobyExport)).lists.map(toFolder);

/** One group imports like v3; several each get a Folder so lists don't collide. */
const fromV4 = async (tobyExport: unknown) => {
  const { groups } = await v4Schema.validate(tobyExport);
  if (groups.length === 1) return groups[0].lists.map(toFolder);
  return groups.map((group) => ({
    title: group.name,
    children: group.lists.map(toFolder),
  }));
};

const PARSERS: Record<
  number,
  (tobyExport: unknown) => Promise<TobyImportNode[]>
> = {
  3: fromV3,
  4: fromV4,
};

/**
 * Validates a Toby export (v3 or v4) and converts it to the Folders and
 * Bookmarks to create. Rejects with a readable message on anything else.
 */
export const parseTobyExport = async (
  tobyExport: unknown,
): Promise<TobyImportNode[]> => {
  const { version } = await object({ version: number().required() }).validate(
    tobyExport,
  );
  const parse = PARSERS[version];
  if (!parse)
    throw new Error(
      `Unsupported Toby export version: ${version}. Supported versions are ${Object.keys(PARSERS).join(" and ")}.`,
    );
  return parse(tobyExport);
};
