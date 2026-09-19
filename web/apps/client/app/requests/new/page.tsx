"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { BLOOD_TYPES, createDonationRequest } from "@bloodheroes/api-client";
import { Alert, Button, Card, Field, Input, Nav, Page, RequireAuth, Select, TextArea, useAuth } from "@bloodheroes/ui";

export default function NewRequestPage() {
  const { client, user, logout } = useAuth();
  const router = useRouter();
  const [bloodType, setBloodType] = useState(user?.blood_type ?? "O+");
  const [notes, setNotes] = useState("");
  const [requisite, setRequisite] = useState("1");
  const [latitude, setLatitude] = useState(user?.latitude != null ? String(user.latitude) : "");
  const [longitude, setLongitude] = useState(user?.longitude != null ? String(user.longitude) : "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const created = await createDonationRequest(client, {
        blood_type: bloodType,
        notes: notes || null,
        requisite_number: Number(requisite),
        latitude: latitude === "" ? null : Number(latitude),
        longitude: longitude === "" ? null : Number(longitude),
      });
      router.push(`/requests/${created.request_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create request");
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
      <Page title="Request blood">
        <Card>
          <form onSubmit={onSubmit}>
            <Field label="Blood type needed">
              <Select value={bloodType} onChange={(e) => setBloodType(e.target.value)}>
                {BLOOD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Units needed">
              <Input type="number" min={1} max={100} value={requisite} onChange={(e) => setRequisite(e.target.value)} />
            </Field>
            <Field label="Notes for donors">
              <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Hospital, urgency, contact details…" />
            </Field>
            <Field label="Latitude (optional, defaults to your profile)">
              <Input value={latitude} onChange={(e) => setLatitude(e.target.value)} inputMode="decimal" />
            </Field>
            <Field label="Longitude (optional, defaults to your profile)">
              <Input value={longitude} onChange={(e) => setLongitude(e.target.value)} inputMode="decimal" />
            </Field>
            <Alert message={error} />
            <Button type="submit" disabled={busy}>
              {busy ? "Publishing…" : "Publish request"}
            </Button>
          </form>
        </Card>
      </Page>
    </RequireAuth>
  );
}
