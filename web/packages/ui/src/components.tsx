"use client";

import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { colors, font, radius, spacing, toneColors } from "./theme";

const controlStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.55rem 0.7rem",
  border: `1px solid ${colors.ink[300]}`,
  borderRadius: radius.md,
  fontSize: font.size.md,
  background: colors.white,
  color: colors.ink[900],
};

export function Button({
  children,
  variant = "primary",
  loading = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
}) {
  const background =
    variant === "primary"
      ? colors.brand[700]
      : variant === "danger"
        ? colors.brand[900]
        : variant === "secondary"
          ? colors.ink[700]
          : "transparent";
  const color = variant === "ghost" ? colors.brand[700] : colors.white;
  const disabled = props.disabled || loading;
  return (
    <button
      {...props}
      disabled={disabled}
      aria-busy={loading || undefined}
      style={{
        background,
        color,
        border: variant === "ghost" ? `1px solid ${colors.brand[700]}` : "none",
        borderRadius: radius.md,
        padding: "0.55rem 1rem",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {loading ? "Working…" : children}
    </button>
  );
}

export function Field({
  label,
  children,
  error,
  hint,
}: {
  label: string;
  children: ReactNode;
  error?: string | null;
  hint?: string | null;
}) {
  return (
    <label style={{ display: "block", marginBottom: spacing.md, fontSize: font.size.sm }}>
      <span style={{ display: "block", marginBottom: spacing.xs, fontWeight: 600 }}>{label}</span>
      {children}
      {hint && !error && (
        <span style={{ display: "block", marginTop: spacing.xs, color: colors.ink[500], fontSize: font.size.xs }}>
          {hint}
        </span>
      )}
      {error && (
        <span
          role="alert"
          style={{ display: "block", marginTop: spacing.xs, color: colors.danger.text, fontSize: font.size.xs }}
        >
          {error}
        </span>
      )}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...controlStyle, ...(props.style ?? {}) }} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} style={{ ...controlStyle, ...(props.style ?? {}) }} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} style={{ ...controlStyle, ...(props.style ?? {}), minHeight: "4.5rem" }} />;
}

export function Card({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section
      style={{
        border: `1px solid ${colors.ink[200]}`,
        borderRadius: radius.lg,
        padding: spacing.lg,
        background: colors.white,
        marginBottom: spacing.lg,
      }}
    >
      {title && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: spacing.sm,
            marginBottom: spacing.md,
            flexWrap: "wrap",
          }}
        >
          <h2 style={{ margin: 0, fontSize: font.size.lg }}>{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: keyof typeof toneColors }) {
  const color = toneColors[tone];
  return (
    <span
      style={{
        display: "inline-block",
        background: `${color}1a`,
        color,
        border: `1px solid ${color}55`,
        borderRadius: radius.pill,
        padding: "0.1rem 0.6rem",
        fontSize: font.size.xs,
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
}

export function Alert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      style={{
        background: colors.danger.bg,
        border: `1px solid ${colors.danger.border}`,
        color: colors.danger.text,
        borderRadius: radius.md,
        padding: "0.6rem 0.8rem",
      }}
    >
      {message}
    </p>
  );
}

export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div style={{ color: colors.ink[500], padding: `${spacing.md} 0` }}>
      <p style={{ margin: `0 0 ${action ? spacing.sm : 0}` }}>{message}</p>
      {action}
    </div>
  );
}

export function Page({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <main id="main" style={{ maxWidth: "72rem", margin: "0 auto", padding: spacing.xl }}>
      <a href="#main" className="sr-only">
        Skip to content
      </a>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: spacing.sm,
          flexWrap: "wrap",
          marginBottom: spacing.lg,
        }}
      >
        <h1 style={{ fontSize: font.size.xl, margin: 0 }}>{title}</h1>
        {actions}
      </div>
      {children}
    </main>
  );
}

export function Nav({
  brand,
  links,
  onLogout,
  email,
}: {
  brand: string;
  links: { href: string; label: string }[];
  onLogout: () => void;
  email: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header
      style={{
        background: colors.brand[900],
        color: colors.white,
        padding: "0.7rem 1.25rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <strong>{brand}</strong>
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
          style={{
            display: "none",
            background: "transparent",
            border: `1px solid ${colors.white}`,
            color: colors.white,
            borderRadius: radius.sm,
            padding: "0.3rem 0.6rem",
            cursor: "pointer",
          }}
          className="bh-nav-toggle"
        >
          ☰
        </button>
        <nav
          aria-label="Primary"
          style={{ display: "flex", gap: "0.9rem", flex: 1, flexWrap: "wrap" }}
          className={open ? "bh-nav-open" : "bh-nav-links"}
        >
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <a
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                style={{
                  color: colors.white,
                  textDecoration: active ? "underline" : "none",
                  textUnderlineOffset: "0.25rem",
                  fontWeight: active ? 700 : 400,
                }}
              >
                {l.label}
              </a>
            );
          })}
        </nav>
        {email && <span style={{ fontSize: font.size.xs }}>{email}</span>}
        <button
          onClick={onLogout}
          style={{
            background: "transparent",
            border: `1px solid ${colors.white}`,
            color: colors.white,
            borderRadius: radius.sm,
            padding: "0.3rem 0.7rem",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>
      <style>{`
        @media (max-width: 640px) {
          .bh-nav-toggle { display: inline-block !important; }
          .bh-nav-links { display: none !important; }
          .bh-nav-open { display: flex !important; flex-direction: column; width: 100%; }
        }
      `}</style>
    </header>
  );
}
