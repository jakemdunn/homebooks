import type { Meta, StoryObj } from "@storybook/react-vite";
import { Settings } from "./settings";
import { SETTINGS_PANEL_VISIBLE } from "./settings.util";
import { withAppProviders } from "../../../.storybook/withAppProviders";

const meta = {
  title: "Forms/Settings",
  component: Settings,
  decorators: [withAppProviders],
} satisfies Meta<typeof Settings>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const Open: Story = {
  parameters: {
    browser: { storage: { session: { [SETTINGS_PANEL_VISIBLE]: true } } },
  },
};
