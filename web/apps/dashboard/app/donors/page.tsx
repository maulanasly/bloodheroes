"use client";

import { useCallback, useEffect, useState } from "react";

import { BLOOD_TYPES, getUser, listUsers, type UserOut } from "@bloodheroes/api-client";
import { Alert, Badge, Button, Card, EmptyState, Field, Nav, Page, RequireAuth, Select, useAuth } from "@bloodheroes/ui";

export default function DonorsPage() {
  const { client, user, logout } = useAuth();
  const [bloodType, setBloodType] = useState("");
  const [items, setItems] = useState<UserOut[]>([]);
  const [count, setCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<UserOut | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await listUsers(client, { blood_type: bloodType || undefined, per_page: 50 });
      setItems(result.users);
      setCount(result.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load donors");
    }
  }, [client, bloodType]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openDonor(userId: number) {
    setError(null);
    try {
      setSelected(await getUser(client, userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load donor");
    }
  }

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
      <Page title={`Donors (${count})`}>
        <Card title="Filters">
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
          <Alert message={error} />
        </Card>
        <Card>
          {items.length === 0 ? (
            <EmptyState message="No donors found." />
          ) : (
            <ul>
              {items.map((d) => (
                <li key={d.user_id}>
                  <a href={`/donors/${d.user_id}`}>
                    {d.firstname} {d.lastname ?? ""}
                  </a>{" "}
                  <Badge tone="red">{d.blood_type ?? "?"}</Badge>{" "}
                  <Button variant="ghost" onClick={() => void openDonor(d.user_id)}>
                    Quick view
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        {selected && (
          <Card title={`Donor #${selected.user_id}`}>
            <p>
              {selected.firstname} {selected.lastname ?? ""} · {selected.email}
            </p>
            <p>
              Blood <Badge tone="red">{selected.blood_type ?? "?"}</Badge> · Gender {selected.gender} ·{" "}
              {selected.level ?? `level ${selected.level_id}`} · status {selected.status}
            </p>
            <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
              Profile edits are made from the donor's own account; operators have read access here.
            </p>
          </Card>
        )}
      </Page>
    </RequireAuth>
  );
}
