"use client";

import type { CSSProperties, ReactNode } from "react";

const controlStyle: CSSProperties = {
  width: "100%",
  padding: "0.55rem 0.7rem",
  border: "1px solid #cbd5e1",
  borderRadius: "0.5rem",
  fontSize: "0.95rem",
};

export function Button({
  children,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" }) {
  const background =
    variant === "primary"
      ? "#b91c1c"
      : variant === "danger"
        ? "#7f1d1d"
        : variant === "secondary"
          ? "#334155"
          : "transparent";
  const color = variant === "ghost" ? "#b91c1c" : "#fff";
  return (
    <button
      {...props}
      style={{
        background,
        color,
        border: variant === "ghost" ? "1px solid #b91c1c" : "none",
        borderRadius: "0.5rem",
        padding: "0.55rem 1rem",
        fontWeight: 600,
        cursor: props.disabled ? "not-allowed" : "pointer",
        opacity: props.disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: "0.75rem", fontSize: "0.9rem" }}>
      <span style={{ display: "block", marginBottom: "0.25rem", fontWeight: 600 }}>{label}</span>
      {children}
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
        border: "1px solid #e2e8f0",
        borderRadius: "0.75rem",
        padding: "1rem",
        background: "#fff",
        marginBottom: "1rem",
      }}
    >
      {title && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: "gray" | "red" | "green" | "amber" | "blue" }) {
  const tones: Record<string, string> = {
    gray: "#64748b",
    red: "#b91c1c",
    green: "#15803d",
    amber: "#b45309",
    blue: "#1d4ed8",
  };
  return (
    <span
      style={{
        display: "inline-block",
        background: `${tones[tone]}1a`,
        color: tones[tone],
        border: `1px solid ${tones[tone]}55`,
        borderRadius: "999px",
        padding: "0.1rem 0.6rem",
        fontSize: "0.8rem",
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
        background: "#fef2f2",
        border: "1px solid #fecaca",
        color: "#991b1b",
        borderRadius: "0.5rem",
        padding: "0.6rem 0.8rem",
      }}
    >
      {message}
    </p>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <p style={{ color: "#64748b" }}>{message}</p>;
}

export function Page({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main style={{ maxWidth: "72rem", margin: "0 auto", padding: "1.25rem" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>{title}</h1>
      {children}
    </main>
  );
}

export function Nav({ brand, links, onLogout, email }: {
  brand: string;
  links: { href: string; label: string }[];
  onLogout: () => void;
  email: string | null;
}) {
  return (
    <header
      style={{
        background: "#7f1d1d",
        color: "#fff",
        padding: "0.7rem 1.25rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        flexWrap: "wrap",
      }}
    >
      <strong>{brand}</strong>
      <nav style={{ display: "flex", gap: "0.9rem", flex: 1 }}>
        {links.map((l) => (
          <a key={l.href} href={l.href} style={{ color: "#fff", textDecoration: "none" }}>
            {l.label}
          </a>
        ))}
      </nav>
      {email && <span style={{ fontSize: "0.85rem" }}>{email}</span>}
      <button
        onClick={onLogout}
        style={{ background: "transparent", border: "1px solid #fff", color: "#fff", borderRadius: "0.4rem", padding: "0.3rem 0.7rem", cursor: "pointer" }}
      >
        Logout
      </button>
    </header>
  );
}
