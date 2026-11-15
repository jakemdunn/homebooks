import { describe, expect, it } from "vitest";
import { parseTobyExport } from "./tobyExport";

const card = (title: string, extra: Record<string, string> = {}) => ({
  title,
  url: `https://${title.toLowerCase()}.example/`,
  customTitle: "",
  customDescription: "",
  ...extra,
});

const v4List = (title: string, cards: ReturnType<typeof card>[]) => ({
  title,
  labelIds: [],
  cards: cards.map((c) => ({ ...c, favIconUrl: "", description: "" })),
});

describe("parseTobyExport", () => {
  it("turns each v3 list into a Folder of Bookmarks", async () => {
    const parsed = await parseTobyExport({
      version: 3,
      lists: [
        { title: "Work", labels: [], cards: [card("One"), card("Two")] },
        { title: "Home", labels: [], cards: [] },
      ],
    });

    expect(parsed).toEqual([
      {
        title: "Work",
        children: [
          { title: "One", url: "https://one.example/" },
          { title: "Two", url: "https://two.example/" },
        ],
      },
      { title: "Home", children: [] },
    ]);
  });

  it("imports a v4 export's only group like v3, a Folder per list", async () => {
    const parsed = await parseTobyExport({
      version: 4,
      groups: [
        {
          name: "My Collections",
          type: "personal",
          lists: [v4List("Work", [card("One")]), v4List("Home", [])],
        },
      ],
      labels: {},
    });

    expect(parsed).toEqual([
      {
        title: "Work",
        children: [{ title: "One", url: "https://one.example/" }],
      },
      { title: "Home", children: [] },
    ]);
  });

  it("puts each v4 group in its own Folder when there are several", async () => {
    const parsed = await parseTobyExport({
      version: 4,
      groups: [
        {
          name: "Mine",
          type: "personal",
          lists: [v4List("Work", [card("One")])],
        },
        { name: "Team", type: "team", lists: [v4List("Work", [])] },
      ],
      labels: {},
    });

    expect(parsed).toEqual([
      {
        title: "Mine",
        children: [
          {
            title: "Work",
            children: [{ title: "One", url: "https://one.example/" }],
          },
        ],
      },
      { title: "Team", children: [{ title: "Work", children: [] }] },
    ]);
  });

  it("titles a Bookmark with the card's custom title when it has one", async () => {
    const parsed = await parseTobyExport({
      version: 3,
      lists: [
        {
          title: "Work",
          cards: [card("One", { customTitle: "My One" }), card("Two")],
        },
      ],
    });

    expect(parsed).toEqual([
      {
        title: "Work",
        children: [
          { title: "My One", url: "https://one.example/" },
          { title: "Two", url: "https://two.example/" },
        ],
      },
    ]);
  });

  it("rejects an unsupported version", async () => {
    await expect(parseTobyExport({ version: 5, groups: [] })).rejects.toThrow(
      "Unsupported Toby export version: 5. Supported versions are 3 and 4.",
    );
  });

  it("rejects a card without a URL", async () => {
    await expect(
      parseTobyExport({
        version: 3,
        lists: [{ title: "Work", cards: [{ title: "One" }] }],
      }),
    ).rejects.toThrow(/url/);
  });
});
