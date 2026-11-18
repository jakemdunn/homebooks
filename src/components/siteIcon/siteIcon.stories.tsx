import type { Meta, StoryObj } from "@storybook/react-vite";
import { SiteIcon } from "./siteIcon";
import { withAppProviders } from "../../../.storybook/withAppProviders";
import { SITE_ICONS } from "../../../.storybook/fakeBrowser/siteIcons";

const meta = {
  title: "Site Icon",
  component: SiteIcon,
  decorators: [withAppProviders],
} satisfies Meta<typeof SiteIcon>;
export default meta;

type Story = StoryObj<typeof meta>;

const bookmarked = (url: string, icon?: string) => ({
  browser: {
    bookmarks: [{ title: "Site", url }],
    siteIcons: icon ? { [new URL(url).host]: icon } : {},
  },
});

/** The site's cached icon. */
export const Image: Story = {
  args: { url: "https://mail.example.com/" },
  parameters: bookmarked("https://mail.example.com/", SITE_ICONS.circle),
};

/** No icon found: the host's first letter, skipping "www.". */
export const LetterTile: Story = {
  args: { url: "https://www.weather.example.org/" },
  parameters: bookmarked("https://www.weather.example.org/"),
};

/** A cached icon that no longer loads falls back to the letter tile. */
export const BrokenImage: Story = {
  args: { url: "https://gone.example.com/" },
  parameters: bookmarked("https://gone.example.com/", SITE_ICONS.broken),
};
