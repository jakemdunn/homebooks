import { describe, expect, it } from "vitest";
import { createFakeBrowser, OTHER_BOOKMARKS } from "./fakeBrowser";

describe("fake browser: bookmarks", () => {
  it("seeds Bookmarks and Folders under Other Bookmarks, typed like Firefox's", async () => {
    const { browser } = createFakeBrowser({
      bookmarks: [
        {
          title: "News",
          children: [{ title: "BBC", url: "https://bbc.example/" }],
        },
        { title: "Mail", url: "https://mail.example/" },
      ],
    });

    const [other] = await browser.bookmarks.getSubTree(OTHER_BOOKMARKS);

    expect(other.children).toMatchObject([
      {
        title: "News",
        type: "folder",
        index: 0,
        parentId: OTHER_BOOKMARKS,
        children: [
          {
            title: "BBC",
            url: "https://bbc.example/",
            type: "bookmark",
            index: 0,
          },
        ],
      },
      {
        title: "Mail",
        url: "https://mail.example/",
        type: "bookmark",
        index: 1,
      },
    ]);
  });
});

describe("fake browser: bookmark changes", () => {
  it("creates a Bookmark at an index and tells onCreated listeners", async () => {
    const { browser } = createFakeBrowser({
      bookmarks: [
        { title: "A", url: "https://a.example/" },
        { title: "B", url: "https://b.example/" },
      ],
    });
    const created: string[] = [];
    browser.bookmarks.onCreated.addListener((_id, node) =>
      created.push(node.title),
    );

    await browser.bookmarks.create({
      parentId: OTHER_BOOKMARKS,
      index: 1,
      title: "New",
      url: "https://new.example/",
    });

    const [other] = await browser.bookmarks.getSubTree(OTHER_BOOKMARKS);
    expect(other.children?.map(({ title, index }) => [title, index])).toEqual([
      ["A", 0],
      ["New", 1],
      ["B", 2],
    ]);
    expect(created).toEqual(["New"]);
  });

  it("moves a Bookmark to its final index, as Firefox does, and tells onMoved listeners", async () => {
    const { browser } = createFakeBrowser({
      bookmarks: [
        { title: "A", url: "https://a.example/" },
        { title: "B", url: "https://b.example/" },
        { title: "C", url: "https://c.example/" },
      ],
    });
    const [other] = await browser.bookmarks.getSubTree(OTHER_BOOKMARKS);
    const a = other.children![0];
    const moves: unknown[] = [];
    browser.bookmarks.onMoved.addListener((id, info) => moves.push([id, info]));

    await browser.bookmarks.move(a.id, { index: 2 });

    const [after] = await browser.bookmarks.getSubTree(OTHER_BOOKMARKS);
    expect(after.children?.map(({ title }) => title)).toEqual(["B", "C", "A"]);
    expect(moves).toEqual([
      [
        a.id,
        {
          parentId: OTHER_BOOKMARKS,
          index: 2,
          oldParentId: OTHER_BOOKMARKS,
          oldIndex: 0,
        },
      ],
    ]);
  });

  it("renames a Bookmark and tells onChanged listeners", async () => {
    const { browser } = createFakeBrowser({
      bookmarks: [{ title: "A", url: "https://a.example/" }],
    });
    const [other] = await browser.bookmarks.getSubTree(OTHER_BOOKMARKS);
    const a = other.children![0];
    const changes: unknown[] = [];
    browser.bookmarks.onChanged.addListener((id, info) =>
      changes.push([id, info]),
    );

    await browser.bookmarks.update(a.id, { title: "Renamed" });

    expect(await browser.bookmarks.get(a.id)).toMatchObject([
      { title: "Renamed", url: "https://a.example/" },
    ]);
    expect(changes).toEqual([
      [a.id, { title: "Renamed", url: "https://a.example/" }],
    ]);
  });

  it("removes a Folder with its contents and tells onRemoved listeners", async () => {
    const { browser } = createFakeBrowser({
      bookmarks: [
        {
          title: "Folder",
          children: [{ title: "A", url: "https://a.example/" }],
        },
        { title: "B", url: "https://b.example/" },
      ],
    });
    const [other] = await browser.bookmarks.getSubTree(OTHER_BOOKMARKS);
    const [folder, bookmark] = other.children!;
    const removed: unknown[] = [];
    browser.bookmarks.onRemoved.addListener((id, info) =>
      removed.push([id, info.parentId, info.index]),
    );

    await browser.bookmarks.removeTree(folder.id);

    const [after] = await browser.bookmarks.getSubTree(OTHER_BOOKMARKS);
    expect(after.children).toMatchObject([{ id: bookmark.id, index: 0 }]);
    expect(removed).toEqual([[folder.id, OTHER_BOOKMARKS, 0]]);
    await expect(browser.bookmarks.get(folder.id)).rejects.toThrow();
  });
});

describe("fake browser: tabs", () => {
  const seed = {
    windows: [
      {
        tabs: [
          { title: "One", url: "https://one.example/" },
          { title: "Two", url: "https://two.example/", active: true },
        ],
      },
      {
        incognito: true,
        tabs: [{ title: "Secret", url: "https://secret.example/" }],
      },
    ],
  };

  it("lists every Window's Tabs, private ones included", async () => {
    const { browser } = createFakeBrowser(seed);

    const tabs = await browser.tabs.query({});

    expect(tabs).toMatchObject([
      { title: "One", windowId: 1, index: 0, active: false, incognito: false },
      { title: "Two", windowId: 1, index: 1, active: true, incognito: false },
      { title: "Secret", windowId: 2, index: 0, active: true, incognito: true },
    ]);
  });

  it("finds the active Tab of the current Window, the first one seeded", async () => {
    const { browser } = createFakeBrowser(seed);

    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    expect(tabs.map(({ title }) => title)).toEqual(["Two"]);
  });
});

describe("fake browser: storage", () => {
  it("answers with seeded values, leaving out keys it has none for", async () => {
    const { browser } = createFakeBrowser({
      storage: { sync: { settings: { rootFolder: OTHER_BOOKMARKS } } },
    });

    expect(await browser.storage.sync.get(["settings", "expanded"])).toEqual({
      settings: { rootFolder: OTHER_BOOKMARKS },
    });
  });

  it("keeps what's set and tells that area's onChanged listeners", async () => {
    const { browser } = createFakeBrowser();
    const changes: unknown[] = [];
    browser.storage.local.onChanged.addListener((change) =>
      changes.push(change),
    );

    await browser.storage.local.set({ menuVisibility: { a: false } });

    expect(await browser.storage.local.get("menuVisibility")).toEqual({
      menuVisibility: { a: false },
    });
    expect(changes).toEqual([{ menuVisibility: { newValue: { a: false } } }]);
  });

  it("opens seeded Folders marked expanded", async () => {
    const { browser } = createFakeBrowser({
      bookmarks: [
        { title: "Open", expanded: true, children: [] },
        { title: "Shut", children: [] },
      ],
    });
    const [other] = await browser.bookmarks.getSubTree(OTHER_BOOKMARKS);

    expect(await browser.storage.sync.get("expanded")).toEqual({
      expanded: [other.children![0].id],
    });
  });
});

describe("fake browser: Site Icons", () => {
  it("caches an entry for every bookmarked host, so no story looks one up", async () => {
    const { browser } = createFakeBrowser({
      bookmarks: [
        { title: "A", url: "https://a.example/page" },
        { title: "F", children: [{ title: "B", url: "https://b.example/" }] },
      ],
      siteIcons: { "a.example": "data:image/svg+xml,a" },
    });

    const { siteIcons } = await browser.storage.local.get("siteIcons");

    expect(siteIcons).toEqual({
      "a.example": { icon: "data:image/svg+xml,a", seen: expect.any(Number) },
      "b.example": { seen: expect.any(Number) },
    });
  });
});

describe("fake browser: runtime and i18n", () => {
  it("gives the extension's English messages", () => {
    const { browser } = createFakeBrowser();

    expect(browser.i18n.getMessage("openInTab")).toBe("Open in New Tab");
  });

  it("looks like Firefox, so the Chromium shim stays off", async () => {
    const { browser } = createFakeBrowser();

    expect(await browser.runtime.getBrowserInfo()).toMatchObject({
      name: "Firefox",
    });
  });
});
