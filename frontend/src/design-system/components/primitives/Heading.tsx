import type { ReactNode } from "react";

type DisplayVariant = "display-hero" | "display-large" | "display-medium" | "display-small";
type HeadingVariant = "heading-large" | "heading-medium" | "heading-small";
type HeadingFont = "display" | "sans";
type HeadingWeight = "normal" | "medium" | "semibold";

interface HeadingProps {
  children: ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  variant?: DisplayVariant | HeadingVariant;
  font?: HeadingFont;
  weight?: HeadingWeight;
  className?: string;
}

const displayStyles: Record<DisplayVariant, React.CSSProperties> = {
  "display-hero": {
    fontFamily: "var(--font-display)",
    fontStyle: "italic",
    fontWeight: 600,
    fontSize: "clamp(3rem, 5vw + 1rem, 5rem)",
    lineHeight: 1.1,
    letterSpacing: "-0.02em",
  },
  "display-large": {
    fontFamily: "var(--font-display)",
    fontStyle: "italic",
    fontWeight: 600,
    fontSize: "clamp(2.25rem, 4vw + 0.5rem, 3.5rem)",
    lineHeight: 1.15,
    letterSpacing: "-0.02em",
  },
  "display-medium": {
    fontFamily: "var(--font-display)",
    fontStyle: "italic",
    fontWeight: 500,
    fontSize: "clamp(1.75rem, 3vw + 0.5rem, 2.5rem)",
    lineHeight: 1.2,
    letterSpacing: "-0.01em",
  },
  "display-small": {
    fontFamily: "var(--font-display)",
    fontStyle: "italic",
    fontWeight: 500,
    fontSize: "clamp(1.5rem, 2vw + 0.5rem, 2rem)",
    lineHeight: 1.25,
    letterSpacing: "-0.01em",
  },
};

const headingStyles: Record<HeadingVariant, React.CSSProperties> = {
  "heading-large": {
    fontFamily: "var(--font-sans)",
    fontWeight: 600,
    fontSize: "clamp(1.25rem, 1.5vw + 0.5rem, 1.5rem)",
    lineHeight: 1.3,
    letterSpacing: "-0.01em",
  },
  "heading-medium": {
    fontFamily: "var(--font-sans)",
    fontWeight: 600,
    fontSize: "clamp(1.125rem, 1vw + 0.5rem, 1.25rem)",
    lineHeight: 1.4,
  },
  "heading-small": {
    fontFamily: "var(--font-sans)",
    fontWeight: 600,
    fontSize: "1rem",
    lineHeight: 1.4,
  },
};

const weightStyles: Record<HeadingWeight, React.CSSProperties> = {
  normal: { fontWeight: 400 },
  medium: { fontWeight: 500 },
  semibold: { fontWeight: 600 },
};

const fontMap: Record<HeadingFont, React.CSSProperties> = {
  display: { fontFamily: "var(--font-display)", fontStyle: "italic" },
  sans: { fontFamily: "var(--font-sans)", fontStyle: "normal" },
};

export function Heading({
  children,
  level = 2,
  variant,
  font = "sans",
  weight = "semibold",
  className = "",
}: HeadingProps) {
  const Component = `h${level}` as keyof JSX.IntrinsicElements;

  const baseStyle = variant
    ? variant.startsWith("display-")
      ? displayStyles[variant as DisplayVariant]
      : headingStyles[variant as HeadingVariant]
    : font === "display"
      ? displayStyles["display-medium"]
      : headingStyles["heading-medium"];

  return (
    <Component
      className={className}
      style={{
        ...baseStyle,
        ...(variant === undefined && fontMap[font]),
        ...weightStyles[weight],
        margin: 0,
      }}
    >
      {children}
    </Component>
  );
}
