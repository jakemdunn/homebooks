import type { Meta, StoryObj } from "@storybook/react-vite";
import { OpenCreateModal } from "../../../.storybook/storyFixtures";
import { withAppProviders } from "../../../.storybook/withAppProviders";

const meta = {
  title: "Forms/Create",
  component: OpenCreateModal,
  decorators: [withAppProviders],
} satisfies Meta<typeof OpenCreateModal>;
export default meta;

type Story = StoryObj<typeof meta>;

export const NewBookmark: Story = { args: { kind: "bookmark" } };

export const NewFolder: Story = { args: { kind: "folder" } };
