import type { Metadata } from "next";
import type { ReactNode } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

import { AuthProvider } from "@bloodheroes/ui";

export const metadata: Metadata = {
  title: "Bloodheroes Dashboard",
  description: "Operations dashboard for the Bloodheroes donation API",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f8fafc" }}>
        <AuthProvider baseUrl="/api/backend" appToken="" storageKey="bh-dashboard-tokens">
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
