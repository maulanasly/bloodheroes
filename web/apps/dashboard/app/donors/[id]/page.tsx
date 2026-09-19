"use client";

import { use, useEffect, useState } from "react";

import { getUser, type UserOut } from "@bloodheroes/api-client";
import { Alert, Badge, Card, EmptyState, Nav, Page, RequireAuth, useAuth } from "@bloodheroes/ui";

export default function DonorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { client, user, logout } = useAuth();
  const [donor, setDonor] = useState<UserOut | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getUser(client, Number(id))
      .then(setDonor)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load donor"));
  }, [client, id]);

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
      <Page title={`Donor #${id}`}>
        <Alert message={error} />
        {!donor ? (
          <EmptyState message="Loading donor…" />
        ) : (
          <Card title={`${donor.firstname} ${donor.lastname ?? ""}`}>
            <p>{donor.email}</p>
            <p>
              <Badge tone="red">{donor.blood_type ?? "?"}</Badge> · Gender {donor.gender} ·{" "}
              {donor.level ?? `level ${donor.level_id}`} · status {donor.status}
            </p>
            <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
              Location: {donor.latitude ?? "—"}, {donor.longitude ?? "—"} · contact {donor.contact ?? "—"}
            </p>
          </Card>
        )}
      </Page>
    </RequireAuth>
  );
}
