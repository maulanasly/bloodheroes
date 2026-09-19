import type { Metadata } from "next";
import type { ReactNode } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

import { AuthProvider } from "@bloodheroes/ui";

export const metadata: Metadata = {
  title: "Bloodheroes",
  description: "Find donors and request blood donations",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#fff7f7" }}>
        <AuthProvider baseUrl="/api/backend" appToken="" storageKey="bh-client-tokens">
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
