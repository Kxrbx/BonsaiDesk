import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardHeader, CardBody, CardFooter, Button } from "./index";
import { Heading, Text } from "../primitives";

const meta: Meta<typeof Card> = {
  title: "Design System/UI/Card",
  component: Card,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    children: <Text>Default card content</Text>,
  },
};

export const Elevated: Story = {
  args: {
    variant: "elevated",
    children: <Text>Elevated card with shadow</Text>,
  },
};

export const Outlined: Story = {
  args: {
    variant: "outlined",
    children: <Text>Outlined card with border only</Text>,
  },
};

export const Interactive: Story = {
  args: {
    interactive: true,
    children: <Text>Click me - I'm interactive!</Text>,
  },
};

export const WithHeaderAndFooter: Story = {
  args: {
    variant: "elevated",
    padding: "lg",
    children: (
      <>
        <CardHeader>
          <Heading level={3}>Card Title</Heading>
        </CardHeader>
        <CardBody>
          <Text color="secondary">
            This is the card body content. It contains the main information
            that users will read.
          </Text>
        </CardBody>
        <CardFooter>
          <Button variant="ghost">Cancel</Button>
          <Button variant="primary">Confirm</Button>
        </CardFooter>
      </>
    ),
  },
};

export const SmallPadding: Story = {
  args: {
    padding: "sm",
    children: <Text>Small padding card</Text>,
  },
};

export const LargePadding: Story = {
  args: {
    padding: "lg",
    children: <Text>Large padding card</Text>,
  },
};
