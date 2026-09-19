"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  BLOOD_TYPES,
  createOffer,
  getGeoDisk,
  listDonationRequests,
  listUsers,
  type DonationRequestOut,
  type GeoDisk,
  type UserOut,
} from "@bloodheroes/api-client";
import { cellsToFeatureCollection, type FeatureCollection } from "@bloodheroes/geo";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  MapLegend,
  Nav,
  Page,
  RequireAuth,
  Select,
  useAuth,
  type MapMarker,
} from "@bloodheroes/ui";

const H3Map = dynamic(() => import("@bloodheroes/ui").then((m) => m.H3Map), { ssr: false });

const EMPTY_COLLECTION: FeatureCollection = { type: "FeatureCollection", features: [] };

export default function DiscoveryPage() {
  const { client, user, logout } = useAuth();
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [distance, setDistance] = useState("5000");
  const [bloodType, setBloodType] = useState("");
  const [mode, setMode] = useState<"requests" | "donors">("requests");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [disk, setDisk] = useState<GeoDisk | null>(null);
  const [donors, setDonors] = useState<UserOut[]>([]);
  const [requests, setRequests] = useState<DonationRequestOut[]>([]);

  useEffect(() => {
    if (user?.latitude != null && user?.longitude != null) {
      setLatitude((v) => v || String(user.latitude));
      setLongitude((v) => v || String(user.longitude));
    }
  }, [user]);

  const overlays = useMemo(
    () => (disk ? cellsToFeatureCollection(disk.cells, "octagon") : EMPTY_COLLECTION),
    [disk],
  );
  const markers: MapMarker[] = useMemo(() => {
    const list = mode === "requests" ? requests : donors;
    return list
      .filter((item) => item.latitude != null && item.longitude != null)
      .map((item, i) => ({
        id: `${mode}-${i}`,
        latitude: item.latitude as number,
        longitude: item.longitude as number,
        title: mode === "requests"
          ? `#${(item as DonationRequestOut).request_id} ${(item as DonationRequestOut).blood_type}`
          : `${(item as UserOut).firstname} (${(item as UserOut).blood_type ?? "?"})`,
        color: mode === "requests" ? "#1d4ed8" : "#b91c1c",
      }));
  }, [mode, requests, donors]);

  const mapCenter = useMemo(() => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { latitude: lat, longitude: lng };
    if (user?.latitude != null && user?.longitude != null) {
      return { latitude: user.latitude, longitude: user.longitude };
    }
    return { latitude: 37.7749, longitude: -122.4194 };
  }, [latitude, longitude, user]);

  const search = useCallback(async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const lat = Number(latitude);
      const lng = Number(longitude);
      const dist = Number(distance);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(dist)) {
        throw new Error("Enter a valid latitude, longitude and distance.");
      }
      const geo = await getGeoDisk(client, { latitude: lat, longitude: lng, distance: dist });
      setDisk(geo);
      if (mode === "requests") {
        const result = await listDonationRequests(client, {
          latitude: lat,
          longitude: lng,
          distance: dist,
          blood_type: bloodType || undefined,
          per_page: 50,
        });
        setRequests(result.donations);
      } else {
        const result = await listUsers(client, {
          latitude: lat,
          longitude: lng,
          distance: dist,
          blood_type: bloodType || undefined,
          per_page: 50,
        });
        setDonors(result.users);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setBusy(false);
    }
  }, [client, latitude, longitude, distance, bloodType, mode]);

  async function offer(requestId: number) {
    setError(null);
    setNotice(null);
    try {
      await createOffer(client, requestId);
      setNotice(`Offer sent for request #${requestId}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send offer");
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
      <Page title="Find help near you">
        <Card title="Search">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(10rem, 1fr))", gap: "0.75rem" }}>
            <Field label="Latitude">
              <Input value={latitude} onChange={(e) => setLatitude(e.target.value)} inputMode="decimal" />
            </Field>
            <Field label="Longitude">
              <Input value={longitude} onChange={(e) => setLongitude(e.target.value)} inputMode="decimal" />
            </Field>
            <Field label="Distance (m)">
              <Input value={distance} onChange={(e) => setDistance(e.target.value)} inputMode="numeric" />
            </Field>
            <Field label="Looking for">
              <Select value={mode} onChange={(e) => setMode(e.target.value as "requests" | "donors")}>
                <option value="requests">Requests to donate to</option>
                <option value="donors">Donors</option>
              </Select>
            </Field>
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
          </div>
          <div style={{ marginTop: "0.5rem" }}>
            <Button onClick={() => void search()} disabled={busy}>
              {busy ? "Searching…" : "Search"}
            </Button>
          </div>
          <Alert message={error} />
          {notice && <p style={{ color: "#15803d" }}>{notice}</p>}
          {disk && (
            <p style={{ fontSize: "0.85rem", color: "#475569" }}>
              Showing {disk.cell_count} of {disk.total_cells} H3 cells as octagon overlays
              {disk.truncated ? " (truncated)" : ""}. Matching still uses the backend hexagon disk.
            </p>
          )}
        </Card>

        <Card title="Map">
          <H3Map
            center={mapCenter}
            overlays={overlays}
            markers={markers}
            onPick={(lat, lng) => {
              setLatitude(lat.toFixed(6));
              setLongitude(lng.toFixed(6));
            }}
          />
          <MapLegend />
        </Card>

        <Card title={mode === "requests" ? "Nearby requests" : "Nearby donors"}>
          {mode === "requests" ? (
            requests.length === 0 ? (
              <EmptyState message="No requests found. Try a wider search." />
            ) : (
              <ul>
                {requests.map((r) => (
                  <li key={r.request_id} style={{ marginBottom: "0.5rem" }}>
                    <a href={`/requests/${r.request_id}`}>
                      #{r.request_id} {r.blood_type} × {r.requisite_number}
                    </a>{" "}
                    <Badge tone="blue">accepted {r.accepted_count}</Badge>{" "}
                    <Button variant="ghost" onClick={() => void offer(r.request_id)}>
                      Offer to donate
                    </Button>
                  </li>
                ))}
              </ul>
            )
          ) : donors.length === 0 ? (
            <EmptyState message="No donors found. Try a wider search." />
          ) : (
            <ul>
              {donors.map((d) => (
                <li key={d.user_id}>
                  {d.firstname} {d.lastname ?? ""} <Badge tone="red">{d.blood_type ?? "?"}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </Page>
    </RequireAuth>
  );
}
