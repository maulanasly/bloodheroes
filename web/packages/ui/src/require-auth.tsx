"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "./auth";

export function RequireAuth({ children, loginHref = "/login" }: { children: ReactNode; loginHref?: string }) {
  const { user, ready, client, sessionExpired } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (!ready) return;
    if (sessionExpired && pathname !== loginHref) {
      const next = encodeURIComponent(pathname);
      router.replace(`${loginHref}?expired=1&next=${next}`);
    } else if ((!client.isAuthenticated() || !user) && pathname !== loginHref) {
      router.replace(loginHref);
    }
  }, [ready, user, client, sessionExpired, router, loginHref, pathname]);
  if (!ready) return <p>Loading…</p>;
  if (sessionExpired) return <p>Session expired, redirecting to login…</p>;
  if (!client.isAuthenticated() || !user) return <p>Redirecting to login…</p>;
  return <>{children}</>;
}
