import { useEffect, useRef } from "react";
import type { Message } from "../types";

interface MessageListProps {
  messages: Message[];
  streamingText: string;
  isSending: boolean;
}

export function MessageList({ messages, streamingText, isSending }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const starterPrompts = [
    "Summarize a local project folder structure.",
    "Draft a system prompt for a coding assistant.",
    "Explain how to optimize a local inference workflow.",
  ];

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }
    element.scrollTo({
      top: element.scrollHeight,
      behavior: messages.length > 0 ? "smooth" : "auto"
    });
  }, [messages, streamingText]);

  return (
    <div ref={containerRef} className="message-list">
      <div className="message-list__inner">
        {messages.length === 0 && !streamingText ? (
          <div className="empty-state">
            <p className="eyebrow">Bonsai Desk</p>
            <h2>Talk to Bonsai on your machine.</h2>
            <p>
              Every answer comes from your local `llama-server` runtime once Bonsai is installed and started.
            </p>
            <div className="empty-state__prompts">
              {starterPrompts.map((prompt) => (
                <div key={prompt} className="empty-state__prompt">
                  <strong>Starter</strong>
                  <span>{prompt}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((message) => (
          <article key={message.id} className={`message-bubble message-bubble--${message.role}`}>
            <header>
              <span>{message.role === "assistant" ? "Bonsai" : message.role === "user" ? "You" : "System"}</span>
            </header>
            <pre>{message.content}</pre>
          </article>
        ))}

        {isSending ? (
          <article className="message-bubble message-bubble--assistant message-bubble--streaming">
            <header>
              <span>Bonsai</span>
            </header>
            <pre aria-live="polite">{streamingText || "Thinking…"}</pre>
          </article>
        ) : null}
      </div>
    </div>
  );
}
