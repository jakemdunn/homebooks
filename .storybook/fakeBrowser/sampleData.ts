import type { FakeBrowserSeed } from "./fakeBrowser";
import { SITE_ICONS } from "./siteIcons";

/**
 * A realistic browser: Bookmarks in Folders a few levels deep, and two
 * Windows of Tabs, the second private. Stories start from it and vary it.
 */
export const SAMPLE_BROWSER: FakeBrowserSeed = {
  bookmarks: [
    {
      title: "Daily",
      expanded: true,
      children: [
        { title: "Inbox", url: "https://mail.example.com/inbox" },
        { title: "Calendar", url: "https://calendar.example.com/week" },
        { title: "Weather", url: "https://weather.example.org/forecast" },
        { title: "Morning news briefing", url: "https://news.example.net/" },
      ],
    },
    {
      title: "Work",
      expanded: true,
      children: [
        { title: "Pull requests", url: "https://code.example.dev/pulls" },
        { title: "Team board", url: "https://board.example.io/team" },
        {
          title: "Design docs",
          children: [
            {
              title: "Architecture overview",
              url: "https://docs.example.io/architecture",
            },
            {
              title: "Release checklist",
              url: "https://docs.example.io/release",
            },
          ],
        },
        { title: "Build status", url: "https://ci.example.dev/builds" },
      ],
    },
    {
      title: "Reading list",
      children: [
        {
          title: "A long read about the history of the bookmark",
          url: "https://essays.example.org/bookmarks",
        },
        { title: "Recipes to try", url: "https://recipes.example.com/saved" },
      ],
    },
    { title: "Someday", children: [] },
    { title: "Music", url: "https://music.example.com/" },
  ],
  siteIcons: {
    "mail.example.com": SITE_ICONS.circle,
    "calendar.example.com": SITE_ICONS.square,
    "weather.example.org": SITE_ICONS.wave,
    "code.example.dev": SITE_ICONS.triangle,
    "board.example.io": SITE_ICONS.bars,
    "ci.example.dev": SITE_ICONS.check,
    "music.example.com": SITE_ICONS.wave,
  },
  windows: [
    {
      tabs: [
        {
          title: "Inbox (3)",
          url: "https://mail.example.com/inbox",
          favIconUrl: SITE_ICONS.circle,
        },
        {
          title: "Pull requests",
          url: "https://code.example.dev/pulls",
          favIconUrl: SITE_ICONS.triangle,
          active: true,
        },
        {
          title: "Build #1042 passed",
          url: "https://ci.example.dev/builds/1042",
          favIconUrl: SITE_ICONS.check,
        },
        { title: "New Tab", url: "about:newtab" },
      ],
    },
    {
      incognito: true,
      tabs: [
        {
          title: "Gift ideas",
          url: "https://shop.example.com/gifts",
          favIconUrl: SITE_ICONS.bars,
        },
      ],
    },
  ],
};
