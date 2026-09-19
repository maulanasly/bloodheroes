"use client";

import { useCallback, useEffect, useState } from "react";

import {
  BLOOD_TYPES,
  REQUEST_STATUS,
  listDonationRequests,
  type DonationRequestOut,
} from "@bloodheroes/api-client";
import { Alert, Badge, Button, Card, EmptyState, Field, Nav, Page, RequireAuth, Select, useAuth } from "@bloodheroes/ui";

export default function RequestsPage() {
  const { client, user, logout } = useAuth();
  const [bloodType, setBloodType] = useState("");
  const [status, setStatus] = useState("");
  const [items, setItems] = useState<DonationRequestOut[]>([]);
  const [count, setCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await listDonationRequests(client, {
        blood_type: bloodType || undefined,
        status: status === "" ? undefined : Number(status),
        per_page: 50,
      });
      setItems(result.donations);
      setCount(result.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load requests");
    } finally {
      setBusy(false);
    }
  }, [client, bloodType, status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <RequireAuth>
      <Nav
        brand="Bloodheroes Ops"
        links={[
          { href: "/", label: "Map" },
          { href: "/requests", label: "Requests" },
          { href: "/donors", label: "Donors" },
        ]}
        onLogout={() => void logout()}
        email={user?.email ?? null}
      />
      <Page title={`Donation requests (${count})`}>
        <Card title="Filters">
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Field label="Blood type">
              <Select value={bloodType} onChange={(e) => setBloodType(e.target.value)}>
                <option value="">Any</option>
                {BLOOD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Any</option>
                {Object.entries(REQUEST_STATUS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <div style={{ alignSelf: "end" }}>
              <Button onClick={() => void load()} disabled={busy}>
                Refresh
              </Button>
            </div>
          </div>
          <Alert message={error} />
        </Card>
        <Card>
          {items.length === 0 ? (
            <EmptyState message="No requests match the current filters." />
          ) : (
            <ul>
              {items.map((r) => (
                <li key={r.request_id}>
                  <a href={`/requests/${r.request_id}`}>
                    #{r.request_id} {r.blood_type} × {r.requisite_number}
                  </a>{" "}
                  <Badge tone="blue">{REQUEST_STATUS[r.status] ?? r.status}</Badge>{" "}
                  <span style={{ color: "#64748b", fontSize: "0.85rem" }}>
                    accepted {r.accepted_count} · {r.requester?.email ?? "unknown requester"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </Page>
    </RequireAuth>
  );
}
