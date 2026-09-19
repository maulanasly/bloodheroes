"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "./auth";

export function RequireAuth({ children, loginHref = "/login" }: { children: ReactNode; loginHref?: string }) {
  const { user, ready, client } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (ready && (!client.isAuthenticated() || !user)) router.replace(loginHref);
  }, [ready, user, client, router, loginHref]);
  if (!ready) return <p>Loading…</p>;
  if (!client.isAuthenticated() || !user) return <p>Redirecting to login…</p>;
  return <>{children}</>;
}
