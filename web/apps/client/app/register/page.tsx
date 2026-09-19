"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { BLOOD_TYPES, registerUser } from "@bloodheroes/api-client";
import { Alert, Button, Card, Field, Input, Page, Select, useAuth } from "@bloodheroes/ui";

export default function RegisterPage() {
  const { client, login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstname: "",
    lastname: "",
    contact: "",
    gender: "U",
    blood_type: "",
    latitude: "",
    longitude: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await registerUser(client, {
        email: form.email,
        password: form.password,
        firstname: form.firstname,
        lastname: form.lastname || null,
        contact: form.contact || null,
        gender: form.gender as "M" | "F" | "U",
        blood_type: form.blood_type || null,
        latitude: form.latitude === "" ? null : Number(form.latitude),
        longitude: form.longitude === "" ? null : Number(form.longitude),
      });
      await login(form.email, form.password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: String(pos.coords.latitude),
          longitude: String(pos.coords.longitude),
        }));
      },
      () => setError("Could not read your location."),
    );
  }

  return (
    <Page title="Create your account">
      <Card>
        <form onSubmit={onSubmit}>
          <Field label="Email">
            <Input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="Password (min 8 characters)">
            <Input type="password" required minLength={8} value={form.password} onChange={(e) => set("password", e.target.value)} />
          </Field>
          <Field label="First name">
            <Input required value={form.firstname} onChange={(e) => set("firstname", e.target.value)} />
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
              <option value="">Select later</option>
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
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <Button type="button" variant="secondary" onClick={useMyLocation}>
              Use my location
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Creating…" : "Create account"}
            </Button>
          </div>
        </form>
      </Card>
    </Page>
  );
}
