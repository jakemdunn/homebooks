import browser from "webextension-polyfill";

export const getAllBookmarksInNodes = (
  nodes: browser.Bookmarks.BookmarkTreeNode[]
): browser.Bookmarks.BookmarkTreeNode[] =>
  nodes.reduce<browser.Bookmarks.BookmarkTreeNode[]>(
    (allBookmarks, bookmark) => [
      ...allBookmarks,
      ...(bookmark.children
        ? getAllBookmarksInNodes(bookmark.children)
        : [bookmark]),
    ],
    []
  ) ?? [];

interface ParsedBookmark {
  title: string;
  url?: string;
  children?: ParsedBookmark[];
}

export const parseHtmlToBookmarks = (html: string): ParsedBookmark[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const crawlHTML = (node: Element): ParsedBookmark[] => {
    const items = node.querySelectorAll(":scope > *");
    return [...items].reduce<ParsedBookmark[]>((acc, item) => {
      switch (item.tagName) {
        case "DL": {
          const title = item.querySelectorAll(":scope > dt");
          const children = crawlHTML(item);
          if (!title.length || !children.length) return acc;
          acc.push({
            title: title.item(0).innerHTML,
            children,
          });
          break;
        }
        case "A": {
          const title = item.innerHTML;
          const url = item.getAttribute("href");
          if (!url) return acc;
          acc.push({ title, url });
          break;
        }
        case "DD": {
          const children = crawlHTML(item);
          if (!children) return acc;
          acc.push(...children);
          break;
        }
      }
      return acc;
    }, []);
  };
  return crawlHTML(doc.body);
};

export const insertBookmarks = async (
  target: browser.Bookmarks.BookmarkTreeNode,
  bookmarks: ParsedBookmark[]
) => {
  for (const bookmark of bookmarks) {
    const newBookmark = await browser.bookmarks.create({
      title: bookmark.title,
      url: bookmark.url,
      parentId: target.id,
    });
    if (bookmark.children) {
      await insertBookmarks(newBookmark, bookmark.children);
    }
  }
};

export const insertBookMarksFromClipboard = async (
  target: browser.Bookmarks.BookmarkTreeNode
) => {
  try {
    const contents = await navigator.clipboard.read();
    for (const item of contents) {
      if (item?.types.includes("text/html")) {
        const html = await (await item.getType("text/html")).text();
        const bookmarks = parseHtmlToBookmarks(html);
        insertBookmarks(target, bookmarks);
        return;
      }
    }
  } catch (error) {
    console.error(error);
  }

  try {
    // const text = await navigator.clipboard.readText();
    // TODO: Launch create dialog
    //   const url = new URL(text);
    //   await browser.permissions.request({
    //     origins: [`*//${url.host}/*`],
    //   });
    //   const content = await fetch(url);
  } catch (error) {
    console.error(error);
  }
};

export const parseBookmarksToHtml = (
  source: browser.Bookmarks.BookmarkTreeNode[]
) => {
  const target = document.createElement("div");

  if (source.length === 1 && source[0].url && source[0].type === "bookmark") {
    const node = source[0];
    const link = document.createElement("A");
    link.setAttribute("HREF", source[0].url);
    link.innerHTML = node.title;
    target.appendChild(link);
    return target.innerHTML;
  }

  const crawlBookmarks = (
    current: Element,
    nodes: browser.Bookmarks.BookmarkTreeNode[]
  ) => {
    for (const node of nodes) {
      if (node.type === "folder" && node.children) {
        const folder = document.createElement("DL");
        const title = document.createElement("DT");
        title.innerHTML = node.title;

        current.appendChild(folder);
        folder.appendChild(title);
        crawlBookmarks(folder, node.children);
      } else if (node.type === "bookmark" && node.url) {
        const linkItem = document.createElement("DD");
        const link = document.createElement("A");
        link.setAttribute("HREF", node.url);
        link.innerHTML = node.title;

        linkItem.appendChild(link);
        current.appendChild(linkItem);
      }
    }
  };
  crawlBookmarks(target, source);
  return target.innerHTML;
};

export const parseBookmarksToPlainText = (
  source: browser.Bookmarks.BookmarkTreeNode[]
) => {
  let plainText = "";
  const crawlBookmarks = (nodes: browser.Bookmarks.BookmarkTreeNode[]) => {
    for (const node of nodes) {
      if (node.type === "folder" && node.children) {
        plainText += `${node.title}\n`;
        crawlBookmarks(node.children);
      } else if (node.type === "bookmark" && node.url) {
        plainText += `${node.url}\n`;
      }
    }
  };
  crawlBookmarks(source);
  return plainText;
};

export const writeBookmarksToClipboard = async (
  nodes: browser.Bookmarks.BookmarkTreeNode[]
) => {
  const clipboardItem = new ClipboardItem({
    "text/plain": new Blob([parseBookmarksToPlainText(nodes)], {
      type: "text/plain",
    }),
    "text/html": new Blob([parseBookmarksToHtml(nodes)], {
      type: "text/html",
    }),
  });
  await navigator.clipboard.write([clipboardItem]);
};
