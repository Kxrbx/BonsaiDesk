interface ComposerProps {
  draft: string;
  disabled: boolean;
  isSending: boolean;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
}

export function Composer({
  draft,
  disabled,
  isSending,
  onDraftChange,
  onSubmit,
  onStop
}: ComposerProps) {
  return (
    <div className="composer-shell">
      <div className="composer-shell__inner">
        <label className="composer__label">
          <span className="sr-only">Message Bonsai locally</span>
          <textarea
            className="composer"
            placeholder="Message Bonsai locally..."
            value={draft}
            disabled={disabled}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSubmit();
              }
            }}
          />
        </label>
      </div>
      <div className="composer__actions">
        <p>Shift+Enter for a newline</p>
        {isSending ? (
          <button className="primary-button primary-button--warn" onClick={onStop}>
            Stop
          </button>
        ) : (
          <button className="primary-button" disabled={disabled || !draft.trim()} onClick={onSubmit}>
            Send
          </button>
        )}
      </div>
    </div>
  );
}
