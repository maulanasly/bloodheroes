"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { BLOOD_TYPES, createDonationRequest } from "@bloodheroes/api-client";
import {
  Alert,
  Button,
  Card,
  Field,
  Input,
  LocationSearch,
  Nav,
  Page,
  RequireAuth,
  Select,
  TextArea,
  useAuth,
  useToast,
} from "@bloodheroes/ui";

export default function NewRequestPage() {
  const { client, user, logout } = useAuth();
  const { notify } = useToast();
  const router = useRouter();
  const [bloodType, setBloodType] = useState(user?.blood_type ?? "O+");
  const [notes, setNotes] = useState("");
  const [requisite, setRequisite] = useState("1");
  const [latitude, setLatitude] = useState(user?.latitude != null ? String(user.latitude) : "");
  const [longitude, setLongitude] = useState(user?.longitude != null ? String(user.longitude) : "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function validate(): boolean {
    const errors: Record<string, string> = {};
    const units = Number(requisite);
    if (!Number.isInteger(units) || units < 1 || units > 100) {
      errors.requisite = "Units must be a whole number between 1 and 100.";
    }
    if ((latitude === "") !== (longitude === "")) {
      errors.location = "Provide both latitude and longitude, or leave both empty to use your profile.";
    }
    if (latitude !== "" && (Number.isNaN(Number(latitude)) || Math.abs(Number(latitude)) > 90)) {
      errors.location = "Latitude must be between -90 and 90.";
    }
    if (longitude !== "" && (Number.isNaN(Number(longitude)) || Math.abs(Number(longitude)) > 180)) {
      errors.location = "Longitude must be between -180 and 180.";
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
      const created = await createDonationRequest(client, {
        blood_type: bloodType,
        notes: notes || null,
        requisite_number: Number(requisite),
        latitude: latitude === "" ? null : Number(latitude),
        longitude: longitude === "" ? null : Number(longitude),
      });
      notify("Request published.", "success");
      router.push(`/requests/${created.request_id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not create request";
      setError(message);
      notify(message, "error");
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
          <form onSubmit={onSubmit} noValidate>
            <Field label="Blood type needed">
              <Select value={bloodType} onChange={(e) => setBloodType(e.target.value)}>
                {BLOOD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Units needed" error={fieldErrors.requisite}>
              <Input
                type="number"
                min={1}
                max={100}
                value={requisite}
                onChange={(e) => setRequisite(e.target.value)}
              />
            </Field>
            <Field label="Notes for donors" hint="Hospital, urgency, and a contact number help donors respond faster.">
              <TextArea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Hospital, urgency, contact details…"
              />
            </Field>
            <Field
              label="Location (optional — defaults to your profile)"
              error={fieldErrors.location}
              hint="Nearby donors are matched around this point."
            >
              <LocationSearch
                latitude={latitude}
                longitude={longitude}
                onCoordinates={(lat, lng) => {
                  setLatitude(lat);
                  setLongitude(lng);
                }}
                onPick={(loc) => {
                  setLatitude(loc.latitude.toFixed(6));
                  setLongitude(loc.longitude.toFixed(6));
                }}
              />
            </Field>
            <Alert message={error} />
            <Button type="submit" loading={busy}>
              Publish request
            </Button>
          </form>
        </Card>
      </Page>
    </RequireAuth>
  );
}
