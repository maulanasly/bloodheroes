"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, Button, Card, Field, Input, Page, useAuth } from "@bloodheroes/ui";

export default function LoginPage() {
  const { login, user, ready, logout } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page title="Sign in">
      <Card>
        {!ready ? (
          <p>Loading…</p>
        ) : user ? (
          <div>
            <p>
              Signed in as <strong>{user.email}</strong>.
            </p>
            <p>
              <a href="/">Find donations near you</a>
            </p>
            <Button variant="secondary" onClick={() => void logout()}>
              Sign out
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <Field label="Email">
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Password">
              <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            <Alert message={error} />
            <Button type="submit" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
            <p>
              New here? <a href="/register">Create an account</a>
            </p>
          </form>
        )}
      </Card>
    </Page>
  );
}
