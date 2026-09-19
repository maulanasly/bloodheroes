"use client";

import type { ReactNode } from "react";

import { AuthProvider, ToastProvider } from "@bloodheroes/ui";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider baseUrl="/api/backend" appToken="" storageKey="bh-dashboard-tokens">
        {children}
      </AuthProvider>
    </ToastProvider>
  );
}
