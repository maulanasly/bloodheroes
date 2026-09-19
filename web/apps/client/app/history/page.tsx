"use client";

import { useCallback, useEffect, useState } from "react";

import { REQUEST_STATUS, donationHistory, type DonationRequestOut } from "@bloodheroes/api-client";
import { Badge, Card, EmptyState, Nav, Page, RequireAuth, useAuth } from "@bloodheroes/ui";

export default function HistoryPage() {
  const { client, user, logout } = useAuth();
  const [items, setItems] = useState<DonationRequestOut[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await donationHistory(client, { per_page: 50 });
      setItems(result.donations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    }
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

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
      <Page title="My donation history">
        {error && <p role="alert">{error}</p>}
        <Card>
          {items.length === 0 ? (
            <EmptyState message="No donations recorded yet. Offer to donate from Discover." />
          ) : (
            <ul>
              {items.map((r) => (
                <li key={r.request_id}>
                  <a href={`/requests/${r.request_id}`}>
                    #{r.request_id} {r.blood_type}
                  </a>{" "}
                  <Badge tone="blue">{REQUEST_STATUS[r.status] ?? r.status}</Badge>{" "}
                  <span style={{ color: "#64748b", fontSize: "0.85rem" }}>
                    {new Date(r.request_date).toLocaleDateString()}
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
