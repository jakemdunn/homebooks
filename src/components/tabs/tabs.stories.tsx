import type { Meta, StoryObj } from "@storybook/react-vite";
import { TabsProvider } from "./tabs";
import {
  BookmarkGrid,
  SeededTab,
  SeededWindow,
} from "../../../.storybook/storyFixtures";
import { withAppProviders } from "../../../.storybook/withAppProviders";
import { SITE_ICONS } from "../../../.storybook/fakeBrowser/siteIcons";

const meta = {
  title: "Tabs",
  decorators: [withAppProviders],
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

/** Every Window's Tabs; the current Window first, the private one after. */
export const TabsColumn: Story = {
  render: () => <TabsProvider />,
};

export const Tab: Story = {
  render: () => (
    <BookmarkGrid>
      <SeededTab title="Pull requests" />
    </BookmarkGrid>
  ),
};

export const PrivateWindowTab: Story = {
  render: () => (
    <BookmarkGrid>
      <SeededTab title="Gift ideas" />
    </BookmarkGrid>
  ),
};

/** The current Window on its own, open. */
export const Window: Story = {
  render: () => <SeededWindow windowId={1} />,
};

/** A private Window on its own: it looks like any other. */
export const PrivateWindow: Story = {
  render: () => <SeededWindow windowId={2} />,
};

/** A Window of only browser pages, which the Tabs list leaves out. */
export const WindowWithNoListedTabs: Story = {
  render: () => <TabsProvider />,
  parameters: {
    browser: {
      windows: [
        {
          tabs: [
            { title: "New Tab", url: "about:newtab" },
            { title: "Settings", url: "about:preferences" },
          ],
        },
        {
          tabs: [
            {
              title: "Inbox",
              url: "https://mail.example.com/",
              favIconUrl: SITE_ICONS.circle,
            },
          ],
        },
      ],
    },
  },
};
