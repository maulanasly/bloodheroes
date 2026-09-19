"use client";

import { useCallback, useEffect, useState } from "react";

import {
  BLOOD_TYPES,
  REQUEST_STATUS,
  listDonationRequests,
  type DonationRequestOut,
} from "@bloodheroes/api-client";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Nav,
  Page,
  Pagination,
  RequireAuth,
  Select,
  SkeletonList,
  useAuth,
  useToast,
} from "@bloodheroes/ui";

const PAGE_SIZE = 10;

export default function RequestsPage() {
  const { client, user, logout } = useAuth();
  const { notify } = useToast();
  const [query, setQuery] = useState({ bloodType: "", status: "", page: 1, nonce: 0 });
  const [items, setItems] = useState<DonationRequestOut[]>([]);
  const [count, setCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await listDonationRequests(client, {
        blood_type: query.bloodType || undefined,
        status: query.status === "" ? undefined : Number(query.status),
        page: query.page,
        per_page: PAGE_SIZE,
      });
      setItems(result.donations);
      setCount(result.count);
      setLoaded(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load requests";
      setError(message);
      notify(message, "error");
    } finally {
      setBusy(false);
    }
  }, [client, query, notify]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

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
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setQuery((q) => ({ ...q, page: 1, nonce: q.nonce + 1 }));
            }}
          >
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "end" }}>
              <Field label="Blood type">
                <Select
                  value={query.bloodType}
                  onChange={(e) => setQuery((q) => ({ ...q, bloodType: e.target.value, page: 1 }))}
                >
                  <option value="">Any</option>
                  {BLOOD_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Status">
                <Select
                  value={query.status}
                  onChange={(e) => setQuery((q) => ({ ...q, status: e.target.value, page: 1 }))}
                >
                  <option value="">Any</option>
                  {Object.entries(REQUEST_STATUS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <div>
                <Button type="submit" loading={busy}>
                  Refresh
                </Button>
              </div>
            </div>
          </form>
          <Alert message={error} />
        </Card>
        <Card>
          {busy && !loaded ? (
            <SkeletonList />
          ) : items.length === 0 ? (
            <EmptyState message="No requests match the current filters." />
          ) : (
            <>
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
              <Pagination
                page={query.page}
                totalPages={totalPages}
                onChange={(p) => setQuery((q) => ({ ...q, page: p }))}
              />
            </>
          )}
        </Card>
      </Page>
    </RequireAuth>
  );
}
