import type { ConversationSummary } from "../types";

interface SidebarProps {
  conversations: ConversationSummary[];
  selectedConversationId: string | null;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onSelect: (conversationId: string) => void;
  onCreate: () => void;
  onRename: (conversationId: string) => void;
  onDelete: (conversationId: string) => void;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function Sidebar({
  conversations,
  selectedConversationId,
  mobileOpen,
  onCloseMobile,
  onSelect,
  onCreate,
  onRename,
  onDelete
}: SidebarProps) {
  return (
    <aside className={`sidebar ${mobileOpen ? "sidebar--mobile-open" : ""}`}>
      <div className="sidebar__brand">
        <div>
          <p className="eyebrow">Local Bonsai workspace</p>
          <h1>Bonsai Desk</h1>
        </div>
        <button className="ghost-button sidebar__mobile-close" onClick={onCloseMobile}>
          Close
        </button>
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
            >
              <button
                className="conversation-card__select"
                onClick={() => onSelect(conversation.id)}
                aria-current={selected ? "true" : undefined}
              >
                <div className="conversation-card__top">
                  <strong>{conversation.title}</strong>
                  <span>{formatDate(conversation.updated_at)}</span>
                </div>
                <p>{conversation.preview || "No messages yet."}</p>
              </button>
              <div className="conversation-card__actions">
                <button
                  className="inline-button"
                  onClick={() => onRename(conversation.id)}
                >
                  Rename
                </button>
                <button
                  className="inline-button inline-button--danger"
                  onClick={() => onDelete(conversation.id)}
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
