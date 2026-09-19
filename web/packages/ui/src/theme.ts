export const colors = {
  brand: {
    50: "#fef2f2",
    100: "#fee2e2",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
  },
  ink: {
    900: "#0f172a",
    700: "#334155",
    500: "#64748b",
    300: "#cbd5e1",
    200: "#e2e8f0",
    100: "#f1f5f8",
    50: "#f8fafc",
  },
  success: { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", solid: "#16a34a" },
  danger: { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", solid: "#b91c1c" },
  warning: { bg: "#fffbeb", border: "#fde68a", text: "#b45309", solid: "#d97706" },
  info: { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", solid: "#2563eb" },
  white: "#ffffff",
} as const;

export type Tone = "gray" | "red" | "green" | "amber" | "blue";

export const toneColors: Record<Tone, string> = {
  gray: colors.ink[500],
  red: colors.brand[700],
  green: colors.success.text,
  amber: colors.warning.text,
  blue: colors.info.text,
};

export const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.25rem",
  xxl: "2rem",
} as const;

export const radius = {
  sm: "0.4rem",
  md: "0.5rem",
  lg: "0.75rem",
  pill: "999px",
} as const;

export const shadows = {
  sm: "0 1px 2px rgba(15, 23, 42, 0.06)",
  md: "0 4px 16px rgba(15, 23, 42, 0.12)",
  lg: "0 12px 40px rgba(15, 23, 42, 0.22)",
} as const;

export const font = {
  family: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  size: {
    xs: "0.8rem",
    sm: "0.85rem",
    md: "0.95rem",
    lg: "1.05rem",
    xl: "1.5rem",
  },
} as const;

export const focusRingColor = "#2563eb";
