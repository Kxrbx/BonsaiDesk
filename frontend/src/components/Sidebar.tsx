import type { ConversationSummary } from "../types";

interface SidebarProps {
  conversations: ConversationSummary[];
  selectedConversationId: string | null;
  onSelect: (conversationId: string) => void;
  onCreate: () => void;
  onRename: (conversationId: string) => void;
  onDelete: (conversationId: string) => void;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function Sidebar({
  conversations,
  selectedConversationId,
  onSelect,
  onCreate,
  onRename,
  onDelete
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div>
          <p className="eyebrow">Local Bonsai workspace</p>
          <h1>Bonsai Desk</h1>
        </div>
      </div>

      <div className="sidebar__actions">
        <button className="primary-button sidebar__new-chat" onClick={onCreate}>
          New chat
        </button>
      </div>

      <div className="sidebar__list">
        {conversations.length === 0 ? (
          <div className="sidebar__empty">
            <p>No conversations yet.</p>
            <span>Your first message will create one automatically.</span>
          </div>
        ) : null}

        {conversations.map((conversation) => {
          const selected = conversation.id === selectedConversationId;
          return (
            <div
              key={conversation.id}
              className={`conversation-card ${selected ? "conversation-card--active" : ""}`}
              onClick={() => onSelect(conversation.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(conversation.id);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="conversation-card__top">
                <strong>{conversation.title}</strong>
                <span>{formatDate(conversation.updated_at)}</span>
              </div>
              <p>{conversation.preview || "No messages yet."}</p>
              <div className="conversation-card__actions">
                <button
                  className="inline-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRename(conversation.id);
                  }}
                >
                  Rename
                </button>
                <button
                  className="inline-button inline-button--danger"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(conversation.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
