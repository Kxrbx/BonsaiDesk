import type { ReactNode } from "react";

type Spacing = 0 | 0.5 | 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 12 | 14 | 16 | 20 | 24;

interface StackProps {
  children: ReactNode;
  direction?: "horizontal" | "vertical";
  gap?: Spacing;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around";
  className?: string;
  wrap?: boolean;
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

const alignMap: Record<string, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
};

const justifyMap: Record<string, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  between: "space-between",
  around: "space-around",
};

export function Stack({
  children,
  direction = "vertical",
  gap = 4,
  align = "stretch",
  justify = "start",
  className = "",
  wrap = false,
}: StackProps) {
  const isHorizontal = direction === "horizontal";

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: isHorizontal ? "row" : "column",
        gap: spacingMap[gap],
        alignItems: alignMap[align],
        justifyContent: justifyMap[justify],
        flexWrap: wrap ? "wrap" : undefined,
      }}
    >
      {children}
    </div>
  );
}
