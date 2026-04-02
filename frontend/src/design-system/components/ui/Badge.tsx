import type { ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: ReactNode;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  default: {
    background: "var(--color-surface-default)",
    borderColor: "var(--color-border-default)",
    color: "var(--color-text-secondary)",
  },
  success: {
    background: "rgba(183, 255, 206, 0.08)",
    borderColor: "rgba(183, 255, 206, 0.25)",
    color: "var(--color-accent-primary)",
  },
  warning: {
    background: "rgba(242, 197, 111, 0.08)",
    borderColor: "rgba(242, 197, 111, 0.25)",
    color: "var(--color-accent-secondary)",
  },
  danger: {
    background: "rgba(255, 143, 125, 0.08)",
    borderColor: "rgba(255, 143, 125, 0.25)",
    color: "var(--color-accent-danger)",
  },
  info: {
    background: "rgba(125, 211, 252, 0.08)",
    borderColor: "rgba(125, 211, 252, 0.25)",
    color: "var(--color-accent-info)",
  },
};

const sizeStyles: Record<BadgeSize, React.CSSProperties> = {
  sm: {
    padding: "4px 8px",
    fontSize: "0.75rem",
  },
  md: {
    padding: "6px 12px",
    fontSize: "0.875rem",
  },
};

export function Badge({
  variant = "default",
  size = "md",
  children,
}: BadgeProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "var(--radius-full)",
        border: "1px solid",
        fontFamily: "var(--font-sans)",
        fontWeight: 500,
        whiteSpace: "nowrap",
        ...variantStyles[variant],
        ...sizeStyles[size],
      }}
    >
      {children}
    </span>
  );
}
