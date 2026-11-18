import type { Decorator } from "@storybook/react-vite";
import { AppProviders } from "./appProviders";

/** Wraps a story in the Homepage's providers, fed by the fake browser. */
export const withAppProviders: Decorator = (Story) => (
  <AppProviders>
    <Story />
  </AppProviders>
);
