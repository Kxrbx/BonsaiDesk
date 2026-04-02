import type { ReactNode } from "react";

type TextVariant = "body" | "body-large" | "body-small" | "caption" | "code";
type TextWeight = "normal" | "medium" | "semibold";
type TextColor = "primary" | "secondary" | "tertiary" | "accent" | "danger";

interface TextProps {
  children: ReactNode;
  variant?: TextVariant;
  weight?: TextWeight;
  color?: TextColor;
  truncate?: boolean | number;
  as?: "p" | "span" | "div" | "label";
  className?: string;
}

const variantStyles: Record<TextVariant, React.CSSProperties> = {
  body: {
    fontFamily: "var(--font-sans)",
    fontSize: "1rem",
    lineHeight: 1.6,
  },
  "body-large": {
    fontFamily: "var(--font-sans)",
    fontSize: "1.125rem",
    lineHeight: 1.6,
  },
  "body-small": {
    fontFamily: "var(--font-sans)",
    fontSize: "0.875rem",
    lineHeight: 1.5,
  },
  caption: {
    fontFamily: "var(--font-sans)",
    fontSize: "0.75rem",
    lineHeight: 1.4,
    letterSpacing: "0.02em",
  },
  code: {
    fontFamily: "var(--font-mono)",
    fontSize: "0.875rem",
    lineHeight: 1.6,
  },
};

const weightStyles: Record<TextWeight, React.CSSProperties> = {
  normal: { fontWeight: 400 },
  medium: { fontWeight: 500 },
  semibold: { fontWeight: 600 },
};

const colorStyles: Record<TextColor, React.CSSProperties> = {
  primary: { color: "var(--color-text-primary)" },
  secondary: { color: "var(--color-text-secondary)" },
  tertiary: { color: "var(--color-text-tertiary)" },
  accent: { color: "var(--color-accent-primary)" },
  danger: { color: "var(--color-accent-danger)" },
};

export function Text({
  children,
  variant = "body",
  weight = "normal",
  color = "primary",
  truncate,
  as: Component = "p",
  className = "",
}: TextProps) {
  const truncateStyle: React.CSSProperties | undefined =
    truncate === true
      ? {
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }
      : typeof truncate === "number"
        ? {
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: truncate,
            WebkitBoxOrient: "vertical",
          }
        : undefined;

  return (
    <Component
      className={className}
      style={{
        ...variantStyles[variant],
        ...weightStyles[weight],
        ...colorStyles[color],
        ...truncateStyle,
        margin: 0,
      }}
    >
      {children}
    </Component>
  );
}
