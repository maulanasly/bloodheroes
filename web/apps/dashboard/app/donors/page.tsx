"use client";

import { useCallback, useEffect, useState } from "react";

import { BLOOD_TYPES, getUser, listUsers, type UserOut } from "@bloodheroes/api-client";
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

export default function DonorsPage() {
  const { client, user, logout } = useAuth();
  const { notify } = useToast();
  const [query, setQuery] = useState({ bloodType: "", page: 1, nonce: 0 });
  const [items, setItems] = useState<UserOut[]>([]);
  const [count, setCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<UserOut | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await listUsers(client, {
        blood_type: query.bloodType || undefined,
        page: query.page,
        per_page: PAGE_SIZE,
      });
      setItems(result.users);
      setCount(result.count);
      setLoaded(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load donors";
      setError(message);
      notify(message, "error");
    } finally {
      setBusy(false);
    }
  }, [client, query, notify]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openDonor(userId: number) {
    setError(null);
    try {
      setSelected(await getUser(client, userId));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load donor";
      setError(message);
      notify(message, "error");
    }
  }

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
      <Page title={`Donors (${count})`}>
        <Card title="Filters">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setQuery((q) => ({ ...q, page: 1, nonce: q.nonce + 1 }));
            }}
          >
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
          </form>
          <Alert message={error} />
        </Card>
        <Card>
          {busy && !loaded ? (
            <SkeletonList />
          ) : items.length === 0 ? (
            <EmptyState message="No donors found." />
          ) : (
            <>
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
              <Pagination
                page={query.page}
                totalPages={totalPages}
                onChange={(p) => setQuery((q) => ({ ...q, page: p }))}
              />
            </>
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
