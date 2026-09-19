"use client";

import { useState } from "react";

import { colors, radius } from "./theme";

export function Skeleton({ height = "1rem", width = "100%" }: { height?: string; width?: string }) {
  return (
    <div
      aria-hidden="true"
      style={{
        height,
        width,
        borderRadius: radius.sm,
        background: `linear-gradient(90deg, ${colors.ink[100]} 25%, ${colors.ink[200]} 50%, ${colors.ink[100]} 75%)`,
        backgroundSize: "200% 100%",
        animation: "bh-pulse 1.4s ease-in-out infinite",
      }}
    />
  );
}

export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }} aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} />
      ))}
    </div>
  );
}

/** Compact page numbers around the current page, e.g. [1, "…", 4, 5, 6, "…", 12]. */
export function pageRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, 2, current - 1, current, current + 1, total - 1, total]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("…");
    out.push(sorted[i]);
  }
  return out;
}

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" style={{ display: "flex", gap: "0.35rem", alignItems: "center", flexWrap: "wrap" }}>
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label="Previous page"
        style={pageButton(page <= 1)}
      >
        ‹ Prev
      </button>
      {pageRange(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} aria-hidden="true" style={{ color: colors.ink[500] }}>
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? "page" : undefined}
            style={pageButton(false, p === page)}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="Next page"
        style={pageButton(page >= totalPages)}
      >
        Next ›
      </button>
    </nav>
  );
}

function pageButton(disabled: boolean, active = false): React.CSSProperties {
  return {
    minWidth: "2.2rem",
    padding: "0.4rem 0.6rem",
    borderRadius: radius.md,
    border: `1px solid ${active ? colors.brand[700] : colors.ink[300]}`,
    background: active ? colors.brand[700] : colors.white,
    color: active ? colors.white : colors.ink[900],
    fontWeight: active ? 700 : 400,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
  };
}

export function KpiCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div
      style={{
        border: `1px solid ${colors.ink[200]}`,
        borderRadius: radius.lg,
        background: colors.white,
        padding: "0.9rem 1rem",
        minWidth: "9rem",
        flex: "1 1 9rem",
      }}
    >
      <div style={{ fontSize: "0.8rem", color: colors.ink[500], fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: "1.6rem", fontWeight: 800 }}>{value}</div>
      {hint && <div style={{ fontSize: "0.8rem", color: colors.ink[500] }}>{hint}</div>}
    </div>
  );
}

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }
  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-label={`${label}: ${value}`}
      title={value}
      style={{
        background: "transparent",
        border: `1px solid ${colors.ink[300]}`,
        borderRadius: radius.sm,
        padding: "0.15rem 0.5rem",
        fontSize: "0.78rem",
        cursor: "pointer",
        color: colors.ink[700],
      }}
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}
