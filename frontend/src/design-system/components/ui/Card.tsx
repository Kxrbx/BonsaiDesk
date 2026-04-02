import type { ReactNode, HTMLAttributes } from "react";

type CardVariant = "default" | "elevated" | "outlined";
type CardPadding = "none" | "sm" | "md" | "lg";
type CardRadius = "sm" | "md" | "lg" | "xl";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  radius?: CardRadius;
  interactive?: boolean;
  children?: ReactNode;
}

const paddingMap: Record<CardPadding, string> = {
  none: "0",
  sm: "var(--space-3)",
  md: "var(--space-4)",
  lg: "var(--space-6)",
};

const radiusMap: Record<CardRadius, string> = {
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  xl: "var(--radius-xl)",
};

const variantStyles: Record<CardVariant, React.CSSProperties> = {
  default: {
    background: "var(--color-background-elevated)",
    border: "1px solid var(--color-border-default)",
  },
  elevated: {
    background: "linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.015)), var(--color-background-elevated)",
    border: "1px solid rgba(209, 224, 214, 0.1)",
    boxShadow: "var(--shadow-md)",
  },
  outlined: {
    background: "transparent",
    border: "1px solid var(--color-border-default)",
  },
};

export function Card({
  variant = "default",
  padding = "md",
  radius = "lg",
  interactive = false,
  children,
  style,
  ...props
}: CardProps) {
  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      style={{
        borderRadius: radiusMap[radius],
        padding: paddingMap[padding],
        ...variantStyles[variant],
        transition: interactive
          ? "transform var(--duration-normal) var(--ease-default), border-color var(--duration-normal) var(--ease-default), background var(--duration-normal) var(--ease-default)"
          : undefined,
        cursor: interactive ? "pointer" : undefined,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (interactive) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.borderColor = "var(--color-border-accent)";
          e.currentTarget.style.background = "linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.02)), var(--color-background-elevated)";
        }
      }}
      onMouseLeave={(e) => {
        if (interactive) {
          e.currentTarget.style.transform = "";
          e.currentTarget.style.borderColor = "";
          e.currentTarget.style.background = "";
        }
      }}
      onKeyDown={(e) => {
        if (interactive && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          e.currentTarget.click();
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "", style }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "var(--space-3)",
        marginBottom: "var(--space-3)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function CardBody({ children, className = "", style }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = "", style }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: "var(--space-2)",
        marginTop: "var(--space-4)",
        paddingTop: "var(--space-3)",
        borderTop: "1px solid var(--color-border-subtle)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
