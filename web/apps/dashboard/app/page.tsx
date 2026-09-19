"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";

import {
  BLOOD_TYPES,
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

const DEFAULT_CENTER = { latitude: 37.7749, longitude: -122.4194 };

export default function DashboardHome() {
  const { client, user, logout } = useAuth();
  const [latitude, setLatitude] = useState(String(DEFAULT_CENTER.latitude));
  const [longitude, setLongitude] = useState(String(DEFAULT_CENTER.longitude));
  const [distance, setDistance] = useState("1000");
  const [bloodType, setBloodType] = useState("");
  const [status, setStatus] = useState("");
  const [showTrueCells, setShowTrueCells] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disk, setDisk] = useState<GeoDisk | null>(null);
  const [donors, setDonors] = useState<UserOut[]>([]);
  const [donorCount, setDonorCount] = useState(0);
  const [requests, setRequests] = useState<DonationRequestOut[]>([]);
  const [requestCount, setRequestCount] = useState(0);

  const overlays = useMemo(
    () => (disk ? cellsToFeatureCollection(disk.cells, "octagon") : EMPTY_COLLECTION),
    [disk],
  );
  const trueCells = useMemo(
    () => (disk && showTrueCells ? cellsToFeatureCollection(disk.cells, "h3") : undefined),
    [disk, showTrueCells],
  );
  const markers: MapMarker[] = useMemo(
    () => [
      ...donors
        .filter((d) => d.latitude != null && d.longitude != null)
        .map((d) => ({
          id: `donor-${d.user_id}`,
          latitude: d.latitude as number,
          longitude: d.longitude as number,
          title: `${d.firstname} (${d.blood_type ?? "?"})`,
          color: "#b91c1c",
        })),
      ...requests
        .filter((r) => r.latitude != null && r.longitude != null)
        .map((r) => ({
          id: `request-${r.request_id}`,
          latitude: r.latitude as number,
          longitude: r.longitude as number,
          title: `#${r.request_id} ${r.blood_type}`,
          color: "#1d4ed8",
        })),
    ],
    [donors, requests],
  );
  const mapCenter = useMemo(() => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    return {
      latitude: Number.isFinite(lat) ? lat : DEFAULT_CENTER.latitude,
      longitude: Number.isFinite(lng) ? lng : DEFAULT_CENTER.longitude,
    };
  }, [latitude, longitude]);

  const search = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const lat = Number(latitude);
      const lng = Number(longitude);
      const dist = Number(distance);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(dist)) {
        throw new Error("Enter a valid latitude, longitude and distance.");
      }
      const [geo, donorResult, requestResult] = await Promise.all([
        getGeoDisk(client, { latitude: lat, longitude: lng, distance: dist }),
        listUsers(client, {
          latitude: lat,
          longitude: lng,
          distance: dist,
          blood_type: bloodType || undefined,
          status: status === "" ? undefined : Number(status),
          per_page: 50,
        }),
        listDonationRequests(client, {
          latitude: lat,
          longitude: lng,
          distance: dist,
          blood_type: bloodType || undefined,
          status: status === "" ? undefined : Number(status),
          per_page: 50,
        }),
      ]);
      setDisk(geo);
      setDonors(donorResult.users);
      setDonorCount(donorResult.count);
      setRequests(requestResult.donations);
      setRequestCount(requestResult.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setBusy(false);
    }
  }, [client, latitude, longitude, distance, bloodType, status]);

  const pick = useCallback((lat: number, lng: number) => {
    setLatitude(lat.toFixed(6));
    setLongitude(lng.toFixed(6));
  }, []);

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
      <Page title="Operations map">
        <Card title="Search area">
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
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </Select>
            </Field>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginTop: "0.5rem", flexWrap: "wrap" }}>
            <Button onClick={() => void search()} disabled={busy}>
              {busy ? "Searching…" : "Search"}
            </Button>
            <label style={{ fontSize: "0.85rem" }}>
              <input type="checkbox" checked={showTrueCells} onChange={(e) => setShowTrueCells(e.target.checked)} />{" "}
              Show true H3 hexagons (audit)
            </label>
          </div>
          <Alert message={error} />
          {disk && (
            <p style={{ fontSize: "0.85rem", color: "#475569" }}>
              Origin cell <code>{disk.origin.cell_id}</code> · resolution {disk.resolution} · k={disk.k} ·
              showing {disk.cell_count} of {disk.total_cells} cells
              {disk.truncated ? " (truncated)" : ""} · {donorCount} donors · {requestCount} requests.
              Octagons are overlays; matching uses the H3 hexagon disk.
            </p>
          )}
        </Card>

        <Card title="Coverage map">
          <H3Map center={mapCenter} overlays={overlays} trueCells={trueCells} markers={markers} onPick={pick} />
          <MapLegend />
        </Card>

        <Card title={`Donors (${donorCount})`}>
          {donors.length === 0 ? (
            <EmptyState message="Run a search to list donors in the area." />
          ) : (
            <ul>
              {donors.map((d) => (
                <li key={d.user_id}>
                  <a href={`/donors/${d.user_id}`}>
                    {d.firstname} {d.lastname ?? ""}
                  </a>{" "}
                  <Badge tone="red">{d.blood_type ?? "?"}</Badge> <Badge>{d.level ?? `level ${d.level_id}`}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={`Requests (${requestCount})`}>
          {requests.length === 0 ? (
            <EmptyState message="Run a search to list donation requests in the area." />
          ) : (
            <ul>
              {requests.map((r) => (
                <li key={r.request_id}>
                  <a href={`/requests/${r.request_id}`}>
                    #{r.request_id} {r.blood_type} × {r.requisite_number}
                  </a>{" "}
                  <Badge tone="blue">
                    {r.status} · accepted {r.accepted_count}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </Page>
    </RequireAuth>
  );
}
