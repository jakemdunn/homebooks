import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";
import { Homepage } from "./Homepage";

/** The whole Homepage, with its own providers, fed by the fake browser. */
const meta = {
  title: "Homepage",
  component: Homepage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Homepage>;
export default meta;

type Story = StoryObj<typeof meta>;

export const FullHomepage: Story = {};

export const Searching: Story = {
  play: async ({ canvasElement }) => {
    const search = await within(canvasElement).findByRole("searchbox");
    await userEvent.type(search, "docs");
  },
};

/** No Bookmarks yet: the Homepage offers to import some. */
export const NoBookmarks: Story = {
  parameters: { browser: { bookmarks: [] } },
};
