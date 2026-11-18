import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  BookmarkGrid,
  SeededBookmark,
} from "../../../.storybook/storyFixtures";
import { withAppProviders } from "../../../.storybook/withAppProviders";
import { SITE_ICONS } from "../../../.storybook/fakeBrowser/siteIcons";
import { withItemMenus } from "../../../.storybook/storyParameters";

const LONG_TITLE =
  "A very long Bookmark title that keeps going well past the width of its tile";

const meta = {
  title: "Bookmark",
  component: SeededBookmark,
  decorators: [
    (Story) => (
      <BookmarkGrid>
        <Story />
      </BookmarkGrid>
    ),
    withAppProviders,
  ],
  parameters: {
    browser: {
      bookmarks: [
        { title: "Inbox", url: "https://mail.example.com/inbox" },
        { title: LONG_TITLE, url: "https://essays.example.org/long" },
        {
          title: "Open Folder",
          expanded: true,
          children: [
            { title: "Calendar", url: "https://calendar.example.com/" },
            { title: "Weather", url: "https://weather.example.org/" },
            { title: "Nested Folder", children: [] },
          ],
        },
        {
          title: "Closed Folder",
          children: [{ title: "Hidden", url: "https://hidden.example.com/" }],
        },
        { title: "Empty Folder", expanded: true, children: [] },
        {
          title: `${LONG_TITLE}, in a Folder`,
          children: [{ title: "Inside", url: "https://inside.example.com/" }],
        },
      ],
      siteIcons: {
        "mail.example.com": SITE_ICONS.circle,
        "calendar.example.com": SITE_ICONS.square,
      },
    },
  },
} satisfies Meta<typeof SeededBookmark>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Bookmark: Story = { args: { title: "Inbox" } };

export const LongTitle: Story = { args: { title: LONG_TITLE } };

export const EditingBookmark: Story = {
  args: { title: "Inbox", editing: true },
};

export const OpenFolder: Story = { args: { title: "Open Folder" } };

export const ClosedFolder: Story = { args: { title: "Closed Folder" } };

/** An open Folder with no Bookmarks offers to create one. */
export const EmptyFolder: Story = { args: { title: "Empty Folder" } };

export const FolderWithLongTitle: Story = {
  args: { title: `${LONG_TITLE}, in a Folder` },
};

export const EditingFolder: Story = {
  args: { title: "Open Folder", editing: true },
};

/** With the "Item Menus" setting on, each tile shows its menu button. */
export const WithItemMenus: Story = {
  args: { title: "Open Folder" },
  parameters: withItemMenus("contextMenuOptionBoth"),
};
