import type { CSSProperties, ReactNode } from "react";

type HTMLTag = keyof JSX.IntrinsicElements;
type Spacing = 0 | 0.5 | 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 12 | 14 | 16 | 20 | 24;

interface BoxProps {
  as?: HTMLTag;
  children?: ReactNode;
  className?: string;
  padding?: Spacing;
  paddingX?: Spacing;
  paddingY?: Spacing;
  paddingTop?: Spacing;
  paddingRight?: Spacing;
  paddingBottom?: Spacing;
  paddingLeft?: Spacing;
  margin?: Spacing;
  marginX?: Spacing;
  marginY?: Spacing;
  marginTop?: Spacing;
  marginRight?: Spacing;
  marginBottom?: Spacing;
  marginLeft?: Spacing;
  background?: CSSProperties["background"];
  border?: CSSProperties["border"];
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
  shadow?: "none" | "sm" | "md" | "lg" | "xl" | "glow" | "inner";
  style?: CSSProperties;
  onClick?: () => void;
}

const spacingMap: Record<number, string> = {
  0: "var(--space-0)",
  0.5: "var(--space-0-5)",
  1: "var(--space-1)",
  1.5: "var(--space-1-5)",
  2: "var(--space-2)",
  2.5: "var(--space-2-5)",
  3: "var(--space-3)",
  3.5: "var(--space-3-5)",
  4: "var(--space-4)",
  5: "var(--space-5)",
  6: "var(--space-6)",
  7: "var(--space-7)",
  8: "var(--space-8)",
  9: "var(--space-9)",
  10: "var(--space-10)",
  12: "var(--space-12)",
  14: "var(--space-14)",
  16: "var(--space-16)",
  20: "var(--space-20)",
  24: "var(--space-24)",
};

const radiusMap: Record<string, string> = {
  none: "var(--radius-none)",
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  xl: "var(--radius-xl)",
  "2xl": "var(--radius-2xl)",
  "3xl": "var(--radius-3xl)",
  full: "var(--radius-full)",
};

const shadowMap: Record<string, string> = {
  none: "none",
  sm: "var(--shadow-sm)",
  md: "var(--shadow-md)",
  lg: "var(--shadow-lg)",
  xl: "var(--shadow-xl)",
  glow: "var(--shadow-glow)",
  inner: "var(--shadow-inner)",
};

export function Box({
  as: Component = "div",
  children,
  className = "",
  padding,
  paddingX,
  paddingY,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
  margin,
  marginX,
  marginY,
  marginTop,
  marginRight,
  marginBottom,
  marginLeft,
  background,
  border,
  borderRadius,
  shadow,
  style,
  onClick,
  ...props
}: BoxProps) {
  const styles: CSSProperties = {
    ...style,
    ...(padding !== undefined && { padding: spacingMap[padding] }),
    ...(paddingX !== undefined && { paddingLeft: spacingMap[paddingX], paddingRight: spacingMap[paddingX] }),
    ...(paddingY !== undefined && { paddingTop: spacingMap[paddingY], paddingBottom: spacingMap[paddingY] }),
    ...(paddingTop !== undefined && { paddingTop: spacingMap[paddingTop] }),
    ...(paddingRight !== undefined && { paddingRight: spacingMap[paddingRight] }),
    ...(paddingBottom !== undefined && { paddingBottom: spacingMap[paddingBottom] }),
    ...(paddingLeft !== undefined && { paddingLeft: spacingMap[paddingLeft] }),
    ...(margin !== undefined && { margin: spacingMap[margin] }),
    ...(marginX !== undefined && { marginLeft: spacingMap[marginX], marginRight: spacingMap[marginX] }),
    ...(marginY !== undefined && { marginTop: spacingMap[marginY], marginBottom: spacingMap[marginY] }),
    ...(marginTop !== undefined && { marginTop: spacingMap[marginTop] }),
    ...(marginRight !== undefined && { marginRight: spacingMap[marginRight] }),
    ...(marginBottom !== undefined && { marginBottom: spacingMap[marginBottom] }),
    ...(marginLeft !== undefined && { marginLeft: spacingMap[marginLeft] }),
    ...(background !== undefined && { background }),
    ...(border !== undefined && { border }),
    ...(borderRadius !== undefined && { borderRadius: radiusMap[borderRadius] }),
    ...(shadow !== undefined && { boxShadow: shadowMap[shadow] }),
  };

  return (
    <Component className={className} style={styles} onClick={onClick} {...props}>
      {children}
    </Component>
  );
}
