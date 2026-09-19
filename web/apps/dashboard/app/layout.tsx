import type { Metadata } from "next";
import type { ReactNode } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Bloodheroes Dashboard",
  description: "Operations dashboard for the Bloodheroes donation API",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
