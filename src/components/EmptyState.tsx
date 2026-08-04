"use client";

import React from "react";
import Link from "next/link";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  ctaText?: string;
  ctaHref?: string;
  ctaAction?: () => void;
}

export default function EmptyState({ icon, title, description, ctaText, ctaHref, ctaAction }: EmptyStateProps) {
  return (
    <div style={{
      textAlign: "center",
      padding: "5rem 1.5rem",
      border: "1px dashed var(--color-border)",
      borderRadius: "var(--radius-lg)",
      background: "rgba(28, 30, 48, 0.4)", // Slight transparent bg for depth
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    }}>
      {icon && (
        <div style={{ color: "var(--color-text-muted)", marginBottom: "1rem" }}>
          {icon}
        </div>
      )}
      <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--color-text-primary)" }}>
        {title}
      </h3>
      {description && (
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", maxWidth: "400px", marginBottom: "1.5rem" }}>
          {description}
        </p>
      )}
      {ctaText && (
        ctaHref ? (
          <Link href={ctaHref} className="btn btn-primary btn-sm">
            {ctaText}
          </Link>
        ) : (
          <button onClick={ctaAction} className="btn btn-primary btn-sm">
            {ctaText}
          </button>
        )
      )}
    </div>
  );
}
