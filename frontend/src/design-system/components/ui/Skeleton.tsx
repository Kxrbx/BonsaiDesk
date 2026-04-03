import type { CSSProperties } from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  style?: CSSProperties;
}

export function Skeleton({
  width = "100%",
  height = "1rem",
  borderRadius = "var(--radius-md)",
  style,
}: SkeletonProps) {
  return (
    <span
      role="status"
      aria-label="Loading…"
      style={{
        display: "block",
        width,
        height,
        borderRadius,
        background: "linear-gradient(90deg, var(--color-surface-default) 0%, var(--color-surface-hover) 50%, var(--color-surface-default) 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
        ...style,
      }}
    >
      <style>
        {`
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}
      </style>
    </span>
  );
}

export function SkeletonText({
  lines = 3,
  lastLineWidth = "60%",
}: {
  lines?: number;
  lastLineWidth?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? lastLineWidth : "100%"}
          height="0.875rem"
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div
      style={{
        padding: "var(--space-4)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-border-default)",
        background: "var(--color-background-elevated)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
        <Skeleton width="40px" height="40px" borderRadius="var(--radius-full)" />
        <div style={{ flex: 1 }}>
          <Skeleton width="120px" height="0.875rem" style={{ marginBottom: "var(--space-1)" }} />
          <Skeleton width="80px" height="0.75rem" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}
