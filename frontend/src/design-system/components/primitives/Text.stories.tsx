import type { Meta, StoryObj } from "@storybook/react";
import { Text } from "./Text";

const meta: Meta<typeof Text> = {
  title: "Design System/Primitives/Text",
  component: Text,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Text>;

export const Body: Story = {
  args: {
    children: "This is body text. It is used for main content and descriptions.",
  },
};

export const BodyLarge: Story = {
  args: {
    variant: "body-large",
    children: "This is large body text for primary reading content.",
  },
};

export const BodySmall: Story = {
  args: {
    variant: "body-small",
    children: "This is small body text for secondary information.",
  },
};

export const Caption: Story = {
  args: {
    variant: "caption",
    children: "Caption text - used for labels and timestamps",
  },
};

export const Code: Story = {
  args: {
    variant: "code",
    children: "const greeting = 'Hello, World!';",
  },
};

export const Primary: Story = {
  args: {
    color: "primary",
    children: "Primary color text",
  },
};

export const Secondary: Story = {
  args: {
    color: "secondary",
    children: "Secondary color text",
  },
};

export const Tertiary: Story = {
  args: {
    color: "tertiary",
    children: "Tertiary color text",
  },
};

export const Accent: Story = {
  args: {
    color: "accent",
    children: "Accent color text",
  },
};

export const Truncated: Story = {
  args: {
    truncate: true,
    children: "This text will be truncated with an ellipsis if it exceeds the container width.",
  },
};

export const TruncatedLines: Story = {
  args: {
    truncate: 2,
    children: "This text will be truncated after 2 lines. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
};
