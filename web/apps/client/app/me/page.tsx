"use client";

import { useState } from "react";

import { BLOOD_TYPES, updateMe } from "@bloodheroes/api-client";
import { Alert, Badge, Button, Card, Field, Input, Nav, Page, RequireAuth, Select, useAuth } from "@bloodheroes/ui";

export default function ProfilePage() {
  const { user, client, logout, refreshUser } = useAuth();
  const [form, setForm] = useState({
    firstname: user?.firstname ?? "",
    lastname: user?.lastname ?? "",
    contact: user?.contact ?? "",
    gender: user?.gender ?? "U",
    blood_type: user?.blood_type ?? "",
    latitude: user?.latitude != null ? String(user.latitude) : "",
    longitude: user?.longitude != null ? String(user.longitude) : "",
  });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await updateMe(client, {
        firstname: form.firstname || undefined,
        lastname: form.lastname || undefined,
        contact: form.contact || undefined,
        gender: form.gender as "M" | "F" | "U",
        blood_type: form.blood_type || undefined,
        latitude: form.latitude === "" ? undefined : Number(form.latitude),
        longitude: form.longitude === "" ? undefined : Number(form.longitude),
      });
      await refreshUser();
      setNotice("Profile updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update profile");
    } finally {
      setBusy(false);
    }
  }

  return (
    <RequireAuth>
      <Nav
        brand="Bloodheroes"
        links={[
          { href: "/", label: "Discover" },
          { href: "/requests/new", label: "Request blood" },
          { href: "/history", label: "History" },
          { href: "/me", label: "Profile" },
        ]}
        onLogout={() => void logout()}
        email={user?.email ?? null}
      />
      <Page title="My profile">
        <Card title={user ? `${user.email} · ${user.level ?? `level ${user.level_id}`}` : "Profile"}>
          {user && (
            <p>
              <Badge tone="red">{user.blood_type ?? "?"}</Badge> · member since{" "}
              {new Date(user.register_date).toLocaleDateString()}
            </p>
          )}
          <form onSubmit={onSubmit}>
            <Field label="First name">
              <Input value={form.firstname} onChange={(e) => set("firstname", e.target.value)} />
            </Field>
            <Field label="Last name">
              <Input value={form.lastname} onChange={(e) => set("lastname", e.target.value)} />
            </Field>
            <Field label="Contact">
              <Input value={form.contact} onChange={(e) => set("contact", e.target.value)} />
            </Field>
            <Field label="Gender">
              <Select value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                <option value="U">Unspecified</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </Select>
            </Field>
            <Field label="Blood type">
              <Select value={form.blood_type} onChange={(e) => set("blood_type", e.target.value)}>
                <option value="">Unknown</option>
                {BLOOD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Latitude">
              <Input value={form.latitude} onChange={(e) => set("latitude", e.target.value)} inputMode="decimal" />
            </Field>
            <Field label="Longitude">
              <Input value={form.longitude} onChange={(e) => set("longitude", e.target.value)} inputMode="decimal" />
            </Field>
            <Alert message={error} />
            {notice && <p style={{ color: "#15803d" }}>{notice}</p>}
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save profile"}
            </Button>
          </form>
        </Card>
      </Page>
    </RequireAuth>
  );
}
