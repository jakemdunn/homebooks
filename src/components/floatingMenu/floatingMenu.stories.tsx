import type { Meta, StoryObj } from "@storybook/react-vite";
import { fireEvent, within } from "storybook/test";
import { Bookmarks } from "../bookmark/bookmarks";
import { TabsProvider } from "../tabs/tabs";
import { contentStyle } from "../../pages/Homepage.css";
import { withAppProviders } from "../../../.storybook/withAppProviders";
import { withItemMenus } from "../../../.storybook/storyParameters";

const meta = {
  title: "Menus",
  decorators: [withAppProviders],
  render: () => (
    <div className={contentStyle}>
      <Bookmarks />
      <TabsProvider />
    </div>
  ),
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

/** Right-clicks the tile showing `text`, as a person would. */
const rightClick =
  (text: string): Story["play"] =>
  async ({ canvasElement }) => {
    const tile = await within(canvasElement).findByText(text);
    const { x, y, width, height } = tile.getBoundingClientRect();
    fireEvent.contextMenu(tile, {
      clientX: x + width / 2,
      clientY: y + height / 2,
    });
  };

export const BookmarkItemMenu: Story = { play: rightClick("Inbox") };

export const FolderItemMenu: Story = { play: rightClick("Daily") };

export const TabMenu: Story = { play: rightClick("Build #1042 passed") };

/** With "Item Menus" shown, a tile's menu button opens its Item Menu. */
export const ItemMenuButton: Story = {
  parameters: withItemMenus("contextMenuOptionDisplayed"),
  play: async ({ canvasElement }) => {
    const tile = (await within(canvasElement).findByText("Inbox")).closest(
      "[data-drag-id]",
    ) as HTMLElement;
    fireEvent.click(within(tile).getByRole("button", { name: "Item menu" }));
  },
};
