import type { Meta, StoryObj } from "@storybook/react";
import { Heading } from "./Heading";

const meta: Meta<typeof Heading> = {
  title: "Design System/Primitives/Heading",
  component: Heading,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Heading>;

export const Default: Story = {
  args: {
    children: "Section Heading",
  },
};

export const DisplayHero: Story = {
  args: {
    variant: "display-hero",
    children: "Hero Display",
  },
};

export const DisplayLarge: Story = {
  args: {
    variant: "display-large",
    children: "Large Display Heading",
  },
};

export const DisplayMedium: Story = {
  args: {
    variant: "display-medium",
    children: "Medium Display Heading",
  },
};

export const DisplaySmall: Story = {
  args: {
    variant: "display-small",
    children: "Small Display Heading",
  },
};

export const HeadingLarge: Story = {
  args: {
    variant: "heading-large",
    children: "Large Heading",
  },
};

export const HeadingMedium: Story = {
  args: {
    variant: "heading-medium",
    children: "Medium Heading",
  },
};

export const HeadingSmall: Story = {
  args: {
    variant: "heading-small",
    children: "Small Heading",
  },
};

export const DisplayFont: Story = {
  args: {
    font: "display",
    children: "Display Font Heading",
  },
};

export const SansFont: Story = {
  args: {
    font: "sans",
    children: "Sans Font Heading",
  },
};
