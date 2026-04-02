import type { ReactNode } from "react";
import { Box, Text } from "../primitives";

type MessageRole = "user" | "assistant" | "system";
type MessageStatus = "streaming" | "complete" | "error";

interface MessageProps {
  role: MessageRole;
  content: string;
  timestamp?: Date;
  status?: MessageStatus;
  children?: ReactNode;
  onCopy?: () => void;
  onRegenerate?: () => void;
}

const roleLabels: Record<MessageRole, string> = {
  user: "You",
  assistant: "Bonsai",
  system: "System",
};

const roleColors: Record<MessageRole, string> = {
  user: "var(--color-accent-primary)",
  assistant: "var(--color-text-secondary)",
  system: "var(--color-accent-secondary)",
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Message({
  role,
  content,
  timestamp,
  status = "complete",
  children,
}: MessageProps) {
  const isStreaming = status === "streaming";

  return (
    <Box
      as="article"
      padding={4}
      style={{
        maxWidth: "min(88%, 760px)",
        display: "grid",
        gap: "var(--space-2)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-border-default)",
        background:
          role === "user"
            ? "linear-gradient(180deg, rgba(183, 255, 206, 0.12), rgba(255, 255, 255, 0.035))"
            : role === "assistant"
              ? "var(--color-surface-default)"
              : "rgba(242, 197, 111, 0.08)",
        borderColor:
          role === "user"
            ? "var(--color-border-accent)"
            : isStreaming
              ? "var(--color-accent-secondary)"
              : "var(--color-border-default)",
        borderStyle: isStreaming ? "dashed" : "solid",
        animation: "fadeUp var(--duration-slow) var(--ease-smooth) forwards",
        boxShadow: "var(--shadow-md)",
      }}
    >
      <Text
        as="header"
        variant="caption"
        weight="semibold"
        style={{
          color: roleColors[role],
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {roleLabels[role]}
      </Text>

      <Box
        as="pre"
        style={{
          margin: 0,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          lineHeight: 1.65,
          fontFamily: "var(--font-sans)",
          color: "var(--color-text-primary)",
        }}
      >
        {content || (isStreaming ? "Thinking..." : children)}
      </Box>

      {(timestamp || status === "streaming") && (
        <Box
          as="footer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--space-2)",
            paddingTop: "var(--space-2)",
            borderTop: "1px solid var(--color-border-subtle)",
          }}
        >
          <Text variant="caption" color="tertiary">
            {timestamp && `• ${formatTime(timestamp)}`}
            {isStreaming && !timestamp && "• Generating..."}
          </Text>

          {role === "assistant" && status === "complete" && (
            <Box style={{ display: "flex", gap: "var(--space-2)" }}>
              <button
                style={{
                  padding: "4px 8px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border-subtle)",
                  background: "transparent",
                  color: "var(--color-text-tertiary)",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  transition: "all var(--duration-fast) var(--ease-default)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-border-default)";
                  e.currentTarget.style.color = "var(--color-text-secondary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-border-subtle)";
                  e.currentTarget.style.color = "var(--color-text-tertiary)";
                }}
              >
                Copy
              </button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

export function MessageGroup({ children }: { children: ReactNode }) {
  return (
    <Box
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
      }}
    >
      {children}
    </Box>
  );
}
