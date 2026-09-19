"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { Alert, Button, Card, Field, Input, Page, useAuth } from "@bloodheroes/ui";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const expired = searchParams.get("expired") === "1";
  const next = searchParams.get("next") || "/";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page title="Sign in">
      <Card>
        {expired && (
          <p
            role="status"
            style={{
              background: "#fffbeb",
              border: "1px solid #fde68a",
              color: "#b45309",
              borderRadius: "0.5rem",
              padding: "0.6rem 0.8rem",
            }}
          >
            Your session expired — please sign in again.
          </p>
        )}
        <form onSubmit={onSubmit}>
          <Field label="Email">
            <Input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Alert message={error} />
          <Button type="submit" loading={busy}>
            Sign in
          </Button>
          <p>
            New here? <a href="/register">Create an account</a>
          </p>
        </form>
      </Card>
    </Page>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}
