import type { CSSProperties } from "react";

type SpinnerSize = "sm" | "md" | "lg";

interface SpinnerProps {
  size?: SpinnerSize;
  color?: string;
}

const sizeStyles: Record<SpinnerSize, CSSProperties> = {
  sm: { width: "16px", height: "16px", borderWidth: "2px" },
  md: { width: "24px", height: "24px", borderWidth: "2.5px" },
  lg: { width: "32px", height: "32px", borderWidth: "3px" },
};

export function Spinner({ size = "md", color = "currentColor" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      style={{
        display: "inline-block",
        width: sizeStyles[size].width,
        height: sizeStyles[size].height,
        border: `${sizeStyles[size].borderWidth} solid ${color}`,
        borderTopColor: "transparent",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }}
    >
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </span>
  );
}
