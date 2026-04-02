import type { InputHTMLAttributes, ReactNode } from "react";

type InputSize = "sm" | "md" | "lg";
type InputState = "default" | "error" | "success" | "disabled";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: InputSize;
  inputState?: InputState;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
  label?: string;
  error?: string;
}

const sizeStyles: Record<InputSize, React.CSSProperties> = {
  sm: {
    padding: "8px 12px",
    fontSize: "0.875rem",
  },
  md: {
    padding: "12px 14px",
    fontSize: "1rem",
  },
  lg: {
    padding: "14px 16px",
    fontSize: "1.125rem",
  },
};

const stateStyles: Record<InputState, React.CSSProperties> = {
  default: {
    borderColor: "var(--color-border-default)",
    background: "var(--color-surface-default)",
  },
  error: {
    borderColor: "var(--color-accent-danger)",
    background: "rgba(255, 143, 125, 0.08)",
  },
  success: {
    borderColor: "var(--color-accent-primary)",
    background: "var(--color-surface-selected)",
  },
  disabled: {
    borderColor: "var(--color-border-subtle)",
    background: "var(--color-surface-default)",
    opacity: 0.5,
    cursor: "not-allowed",
  },
};

export function Input({
  size = "md",
  inputState = "default",
  leftElement,
  rightElement,
  label,
  error,
  disabled,
  style,
  ...props
}: InputProps) {
  const isDisabled = disabled || inputState === "disabled";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {label && (
        <label
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "var(--color-text-secondary)",
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        {leftElement && (
          <span
            style={{
              position: "absolute",
              left: "12px",
              color: "var(--color-text-tertiary)",
              pointerEvents: "none",
            }}
          >
            {leftElement}
          </span>
        )}
        <input
          disabled={isDisabled}
          style={{
            width: "100%",
            fontFamily: "var(--font-sans)",
            border: "1px solid var(--color-border-default)",
            borderRadius: "var(--radius-lg)",
            color: "var(--color-text-primary)",
            outline: "none",
            transition: "all var(--duration-normal) var(--ease-default)",
            ...sizeStyles[size],
            ...stateStyles[inputState],
            ...(leftElement && { paddingLeft: "40px" }),
            ...(rightElement && { paddingRight: "40px" }),
            ...style,
          }}
          onFocus={(e) => {
            if (!isDisabled) {
              e.currentTarget.style.borderColor = "var(--color-accent-primary)";
              e.currentTarget.style.boxShadow = "0 0 0 2px rgba(183, 255, 206, 0.2)";
            }
          }}
          onBlur={(e) => {
            if (!isDisabled) {
              e.currentTarget.style.borderColor = "var(--color-border-default)";
              e.currentTarget.style.boxShadow = "";
            }
          }}
          {...props}
        />
        {rightElement && (
          <span
            style={{
              position: "absolute",
              right: "12px",
              color: "var(--color-text-tertiary)",
              pointerEvents: "none",
            }}
          >
            {rightElement}
          </span>
        )}
      </div>
      {error && (
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "0.75rem",
            color: "var(--color-accent-danger)",
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
