"use client";

import { useEffect, useState } from "react";

import { BLOOD_TYPES, listLevels, updateMe, type LevelOut } from "@bloodheroes/api-client";
import {
  Alert,
  Badge,
  Button,
  Card,
  Field,
  Input,
  Nav,
  Page,
  RequireAuth,
  Select,
  useAuth,
  useToast,
} from "@bloodheroes/ui";

export default function ProfilePage() {
  const { user, client, logout, refreshUser } = useAuth();
  const { notify } = useToast();
  const [form, setForm] = useState({
    firstname: user?.firstname ?? "",
    lastname: user?.lastname ?? "",
    contact: user?.contact ?? "",
    gender: user?.gender ?? "U",
    blood_type: user?.blood_type ?? "",
    latitude: user?.latitude != null ? String(user.latitude) : "",
    longitude: user?.longitude != null ? String(user.longitude) : "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [levels, setLevels] = useState<LevelOut[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listLevels(client).then(setLevels).catch(() => null);
  }, [client]);

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((e) => ({ ...e, [key]: "" }));
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!form.firstname.trim()) errors.firstname = "First name is required.";
    if (form.latitude !== "" && (Number.isNaN(Number(form.latitude)) || Math.abs(Number(form.latitude)) > 90)) {
      errors.latitude = "Latitude must be between -90 and 90.";
    }
    if (form.longitude !== "" && (Number.isNaN(Number(form.longitude)) || Math.abs(Number(form.longitude)) > 180)) {
      errors.longitude = "Longitude must be between -180 and 180.";
    }
    if ((form.latitude === "") !== (form.longitude === "")) {
      errors.latitude = errors.latitude || "Provide both latitude and longitude, or neither.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    setError(null);
    try {
      await updateMe(client, {
        firstname: form.firstname.trim() || undefined,
        lastname: form.lastname || undefined,
        contact: form.contact || undefined,
        gender: form.gender as "M" | "F" | "U",
        blood_type: form.blood_type || undefined,
        latitude: form.latitude === "" ? undefined : Number(form.latitude),
        longitude: form.longitude === "" ? undefined : Number(form.longitude),
      });
      await refreshUser();
      notify("Profile updated.", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not update profile";
      setError(message);
      notify(message, "error");
    } finally {
      setBusy(false);
    }
  }

  const currentLevel = levels.find((l) => l.level_id === user?.level_id);
  const nextLevel = levels.find((l) => (currentLevel ? l.min_score > currentLevel.min_score : l.min_score > 0));

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
            <>
              <p>
                <Badge tone="red">{user.blood_type ?? "?"}</Badge> · member since{" "}
                {new Date(user.register_date).toLocaleDateString()}
              </p>
              {nextLevel && (
                <div style={{ marginBottom: "1rem" }}>
                  <p style={{ margin: "0 0 0.25rem", fontSize: "0.85rem" }}>
                    {nextLevel.min_score} accomplished donations reach <strong>{nextLevel.name}</strong>
                  </p>
                  <div
                    role="progressbar"
                    aria-label={`Progress to ${nextLevel.name}`}
                    aria-valuemin={currentLevel?.min_score ?? 0}
                    aria-valuemax={nextLevel.min_score}
                    style={{ background: "#e2e8f0", borderRadius: "999px", height: "0.6rem", overflow: "hidden" }}
                  >
                    <div
                      style={{
                        width: `${Math.min(
                          100,
                          ((currentLevel?.min_score ?? 0) / nextLevel.min_score) * 100,
                        )}%`,
                        background: "#b91c1c",
                        height: "100%",
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
          <form onSubmit={onSubmit} noValidate>
            <Field label="First name" error={fieldErrors.firstname}>
              <Input value={form.firstname} onChange={(e) => set("firstname", e.target.value)} />
            </Field>
            <Field label="Last name">
              <Input value={form.lastname} onChange={(e) => set("lastname", e.target.value)} />
            </Field>
            <Field label="Contact">
              <Input
                value={form.contact}
                onChange={(e) => set("contact", e.target.value)}
                placeholder="Phone number donors can reach"
              />
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
            <Field label="Latitude" error={fieldErrors.latitude}>
              <Input value={form.latitude} onChange={(e) => set("latitude", e.target.value)} inputMode="decimal" />
            </Field>
            <Field label="Longitude" error={fieldErrors.longitude}>
              <Input value={form.longitude} onChange={(e) => set("longitude", e.target.value)} inputMode="decimal" />
            </Field>
            <Alert message={error} />
            <Button type="submit" loading={busy}>
              Save profile
            </Button>
          </form>
        </Card>
      </Page>
    </RequireAuth>
  );
}
