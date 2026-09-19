"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { colors, radius, shadows } from "./theme";

export type ToastTone = "success" | "error" | "info";

export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

type ToastAction =
  | { type: "push"; toast: Toast }
  | { type: "dismiss"; id: number };

export function toastReducer(state: Toast[], action: ToastAction): Toast[] {
  switch (action.type) {
    case "push":
      return [...state.slice(-2), action.toast];
    case "dismiss":
      return state.filter((t) => t.id !== action.id);
  }
}

let nextId = 1;

interface ToastContextValue {
  notify: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneStyles: Record<ToastTone, { bg: string; border: string; text: string }> = {
  success: colors.success,
  error: colors.danger,
  info: colors.info,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, tone: ToastTone = "info") => {
    const id = nextId++;
    setToasts((prev) => toastReducer(prev, { type: "push", toast: { id, message, tone } }));
    window.setTimeout(() => {
      setToasts((prev) => toastReducer(prev, { type: "dismiss", id }));
    }, 5000);
  }, []);

  // Clear toasts on unmount / navigation safety.
  useEffect(() => () => setToasts([]), []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        style={{
          position: "fixed",
          bottom: "1rem",
          right: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          zIndex: 200,
          maxWidth: "min(24rem, calc(100vw - 2rem))",
        }}
      >
        {toasts.map((toast) => {
          const style = toneStyles[toast.tone];
          return (
            <div
              key={toast.id}
              role={toast.tone === "error" ? "alert" : "status"}
              style={{
                background: style.bg,
                border: `1px solid ${style.border}`,
                color: style.text,
                borderRadius: radius.md,
                boxShadow: shadows.md,
                padding: "0.6rem 0.8rem",
                fontSize: "0.9rem",
              }}
            >
              {toast.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
