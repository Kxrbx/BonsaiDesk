import type { Meta, StoryObj } from "@storybook/react";
import { Message, MessageGroup } from "./Message";

const meta: Meta<typeof Message> = {
  title: "Design System/Domain/Message",
  component: Message,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof Message>;

export const UserMessage: Story = {
  args: {
    role: "user",
    content: "Hello! Can you help me understand how local AI inference works?",
    timestamp: new Date(),
  },
};

export const AssistantMessage: Story = {
  args: {
    role: "assistant",
    content: `Local AI inference runs models directly on your machine without internet connectivity. Here's how it works:

1. The model is loaded into memory
2. Your prompts are processed locally
3. Responses are generated using your hardware

This approach offers privacy, offline capability, and no recurring costs.`,
    timestamp: new Date(),
  },
};

export const SystemMessage: Story = {
  args: {
    role: "system",
    content: "System prompt: You are a helpful coding assistant.",
  },
};

export const StreamingMessage: Story = {
  args: {
    role: "assistant",
    content: "I'm thinking…",
    status: "streaming",
  },
};

export const GroupedMessages: Story = {
  render: () => (
    <MessageGroup>
      <Message
        role="user"
        content="Can you explain closures in JavaScript?"
        timestamp={new Date(Date.now() - 60000)}
      />
      <Message
        role="assistant"
        content={`A closure is a function that has access to variables from its outer (enclosing) scope, even after the outer function has returned.

Here's an example:

\`\`\`javascript
function createCounter() {
  let count = 0;
  
  return function() {
    count++;
    return count;
  };
}

const counter = createCounter();
console.log(counter()); // 1
console.log(counter()); // 2
\`\`\`

The inner function "closes over" the \`count\` variable, keeping it alive even after \`createCounter\` finishes executing.`}
        timestamp={new Date()}
      />
    </MessageGroup>
  ),
};
