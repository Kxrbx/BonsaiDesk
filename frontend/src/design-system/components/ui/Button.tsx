import type { ReactNode, ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  state?: "default" | "loading" | "disabled";
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "linear-gradient(135deg, rgba(242, 197, 111, 0.96), rgba(183, 255, 206, 0.78))",
    color: "#101311",
    border: "0",
    fontWeight: 700,
  },
  secondary: {
    background: "var(--color-surface-default)",
    color: "var(--color-text-primary)",
    border: "1px solid var(--color-border-default)",
  },
  ghost: {
    background: "transparent",
    color: "var(--color-text-primary)",
    border: "1px solid var(--color-border-strong)",
  },
  danger: {
    background: "rgba(255, 143, 125, 0.95)",
    color: "#24110d",
    border: "0",
    fontWeight: 700,
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: {
    padding: "6px 12px",
    fontSize: "0.875rem",
    gap: "6px",
  },
  md: {
    padding: "10px 14px",
    fontSize: "1rem",
    gap: "8px",
  },
  lg: {
    padding: "14px 20px",
    fontSize: "1.125rem",
    gap: "10px",
  },
};

export function Button({
  variant = "secondary",
  size = "md",
  state = "default",
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || state === "disabled";
  const isLoading = state === "loading";

  return (
    <button
      disabled={isDisabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "var(--radius-full)",
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.5 : 1,
        width: fullWidth ? "100%" : undefined,
        fontFamily: "var(--font-sans)",
        transition: "background-color var(--duration-normal) var(--ease-default), color var(--duration-normal) var(--ease-default), border-color var(--duration-normal) var(--ease-default), transform var(--duration-normal) var(--ease-default), filter var(--duration-normal) var(--ease-default)",
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!isDisabled && !isLoading) {
          e.currentTarget.style.filter = "brightness(1.05)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.filter = "";
        e.currentTarget.style.transform = "";
      }}
      onMouseDown={(e) => {
        if (!isDisabled && !isLoading) {
          e.currentTarget.style.transform = "scale(0.98)";
        }
      }}
      onMouseUp={(e) => {
        if (!isDisabled && !isLoading) {
          e.currentTarget.style.transform = "";
        }
      }}
      {...props}
    >
      {isLoading ? (
        <span
          style={{
            width: "16px",
            height: "16px",
            border: "2px solid currentColor",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </button>
  );
}
