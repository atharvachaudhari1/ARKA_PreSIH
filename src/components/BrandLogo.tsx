import React from "react";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  layout?: "stacked" | "inline";
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Geometric inline double-line wordmark for "ARKA!"
 * Mimics an architectural stencil / inline cyber font.
 */
function ArkaWordmark({ height = 16, color = "#1a1a1a" }: { height?: number; color?: string }) {
  return (
    <svg
      height={height}
      viewBox="0 0 148 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", verticalAlign: "middle", overflow: "visible" }}
    >
      <g stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {/* Letter A (First) */}
        <path d="M 4 31 L 16 3 L 28 31" />
        <path d="M 10 31 L 16 15 L 22 31" strokeWidth="1.8" />
        <path d="M 7 24 L 25 24" strokeWidth="1.8" />

        {/* Letter R */}
        <path d="M 36 31 L 36 3 L 52 3 C 60 3 60 17 51 18 L 36 18 M 49 18 L 62 31" />
        <path d="M 42 31 L 42 8 L 49 8 C 54 8 54 13 49 14 L 42 14 M 46 18 L 56 31" strokeWidth="1.6" />

        {/* Letter K */}
        <path d="M 70 31 L 70 3 M 94 3 L 76 18 L 95 31" />
        <path d="M 76 31 L 76 3 M 86 8 L 76 18 L 87 31" strokeWidth="1.6" />

        {/* Letter A (Second) */}
        <path d="M 102 31 L 114 3 L 126 31" />
        <path d="M 108 31 L 114 15 L 120 31" strokeWidth="1.8" />
        <path d="M 105 24 L 123 24" strokeWidth="1.8" />

        {/* Exclamation Point ! */}
        <path d="M 135 3 L 135 23" strokeWidth="3" />
        <path d="M 135 28 L 135 32" strokeWidth="3" />
      </g>
    </svg>
  );
}

export default function BrandLogo({ size = "md", layout = "stacked", className = "", style = {} }: BrandLogoProps) {
  // Dimensions based on size
  const sizes = {
    sm: {
      titleFontSize: "1.45rem",
      tagFontSize: "0.85rem",
      arkaHeight: 15,
      gap: "2px",
      shadow: "2px 2px 0px #f59e0b",
      bracketShadow: "2px 2px 0px #1a1a1a",
    },
    md: {
      titleFontSize: "2rem",
      tagFontSize: "1.1rem",
      arkaHeight: 22,
      gap: "4px",
      shadow: "2.5px 2.5px 0px #f59e0b",
      bracketShadow: "2px 2px 0px #1a1a1a",
    },
    lg: {
      titleFontSize: "2.35rem",
      tagFontSize: "1.15rem",
      arkaHeight: 22,
      gap: "6px",
      shadow: "3px 3px 0px #f59e0b",
      bracketShadow: "2.5px 2.5px 0px #1a1a1a",
    },
  };

  const currentSize = sizes[size];

  return (
    <div
      className={`brand-logo-container ${className}`}
      style={{
        display: "inline-flex",
        flexDirection: layout === "stacked" ? "column" : "row",
        alignItems: layout === "stacked" ? "center" : "baseline",
        justifyContent: "center",
        gap: layout === "stacked" ? currentSize.gap : "0.5rem",
        textDecoration: "none",
        userSelect: "none",
        ...style,
      }}
    >
      {/* Top element: <TeamUp/> */}
      <div
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontWeight: 900,
          fontSize: currentSize.titleFontSize,
          lineHeight: 1.1,
          color: "#1a1a1a",
          letterSpacing: "-0.03em",
          whiteSpace: "nowrap",
          textShadow: currentSize.shadow,
          position: "relative",
        }}
      >
        <span
          style={{
            color: "#5b5fc7",
            fontWeight: 900,
            textShadow: currentSize.bracketShadow,
            marginRight: "2px",
          }}
        >
          {"<"}
        </span>
        <span>TeamUp</span>
        <span
          style={{
            color: "#5b5fc7",
            fontWeight: 900,
            textShadow: currentSize.bracketShadow,
            marginLeft: "2px",
          }}
        >
          {"/>"}
        </span>
      </div>

      {/* Bottom element: by ARKA! */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.35rem",
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: currentSize.tagFontSize,
            fontWeight: 700,
            color: "#1a1a1a",
            letterSpacing: "0.01em",
            transform: "translateY(1px)"
          }}
        >
          by
        </span>
        <ArkaWordmark height={currentSize.arkaHeight} color="#1a1a1a" />
      </div>
    </div>
  );
}
