"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  BLOOD_TYPES,
  REQUEST_STATUS,
  getGeoDisk,
  getStatsOverview,
  listDonationRequests,
  listUsers,
  type DonationRequestOut,
  type GeoDisk,
  type StatsOverview,
  type UserOut,
} from "@bloodheroes/api-client";
import { cellsToFeatureCollection, type FeatureCollection } from "@bloodheroes/geo";
import {
  Alert,
  Badge,
  Button,
  Card,
  CopyButton,
  EmptyState,
  Field,
  Input,
  KpiCard,
  LocationSearch,
  MapLegend,
  Nav,
  Page,
  Pagination,
  RequireAuth,
  Select,
  SkeletonList,
  useAuth,
  useToast,
  type MapMarker,
} from "@bloodheroes/ui";

const H3Map = dynamic(() => import("@bloodheroes/ui").then((m) => m.H3Map), { ssr: false });

const EMPTY_COLLECTION: FeatureCollection = { type: "FeatureCollection", features: [] };
const DEFAULT_CENTER = { latitude: 37.7749, longitude: -122.4194 };
const PAGE_SIZE = 10;

export default function DashboardHome() {
  const { client, user, logout } = useAuth();
  const { notify } = useToast();
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [distance, setDistance] = useState("1000");
  const [bloodType, setBloodType] = useState("");
  const [status, setStatus] = useState("");
  const [showTrueCells, setShowTrueCells] = useState(false);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disk, setDisk] = useState<GeoDisk | null>(null);
  const [focusKey, setFocusKey] = useState(0);
  const [donors, setDonors] = useState<UserOut[]>([]);
  const [donorCount, setDonorCount] = useState(0);
  const [donorPage, setDonorPage] = useState(1);
  const [requests, setRequests] = useState<DonationRequestOut[]>([]);
  const [requestCount, setRequestCount] = useState(0);
  const [requestPage, setRequestPage] = useState(1);
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const autoSearched = useRef(false);

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
          href: `/donors/${d.user_id}`,
        })),
      ...requests
        .filter((r) => r.latitude != null && r.longitude != null)
        .map((r) => ({
          id: `request-${r.request_id}`,
          latitude: r.latitude as number,
          longitude: r.longitude as number,
          title: `#${r.request_id} ${r.blood_type}`,
          color: "#1d4ed8",
          href: `/requests/${r.request_id}`,
        })),
    ],
    [donors, requests],
  );
  const mapCenter = useMemo(() => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    return {
      latitude: Number.isFinite(lat) && latitude !== "" ? lat : DEFAULT_CENTER.latitude,
      longitude: Number.isFinite(lng) && longitude !== "" ? lng : DEFAULT_CENTER.longitude,
    };
  }, [latitude, longitude]);

  const runSearch = useCallback(
    async (lat: number, lng: number, dist: number, donorPg: number, requestPg: number) => {
      setBusy(true);
      setError(null);
      try {
        const [geo, donorResult, requestResult] = await Promise.all([
          getGeoDisk(client, { latitude: lat, longitude: lng, distance: dist }),
          listUsers(client, {
            latitude: lat,
            longitude: lng,
            distance: dist,
            blood_type: bloodType || undefined,
            status: status === "" ? undefined : Number(status),
            page: donorPg,
            per_page: PAGE_SIZE,
          }),
          listDonationRequests(client, {
            latitude: lat,
            longitude: lng,
            distance: dist,
            blood_type: bloodType || undefined,
            status: status === "" ? undefined : Number(status),
            page: requestPg,
            per_page: PAGE_SIZE,
          }),
        ]);
        setDisk(geo);
        setDonors(donorResult.users);
        setDonorCount(donorResult.count);
        setRequests(requestResult.donations);
        setRequestCount(requestResult.count);
        setSearched(true);
        setFocusKey((k) => k + 1);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Search failed";
        setError(message);
        notify(message, "error");
      } finally {
        setBusy(false);
      }
    },
    [client, bloodType, status, notify],
  );

  const search = useCallback(async () => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    const dist = Number(distance);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(dist) || dist <= 0) {
      const message = "Enter a valid latitude, longitude and distance.";
      setError(message);
      notify(message, "error");
      return;
    }
    setDonorPage(1);
    setRequestPage(1);
    await runSearch(lat, lng, dist, 1, 1);
  }, [latitude, longitude, distance, runSearch, notify]);

  // Auto-search on first load: profile location, else the default view.
  useEffect(() => {
    if (autoSearched.current || !user) return;
    autoSearched.current = true;
    const lat = user.latitude ?? DEFAULT_CENTER.latitude;
    const lng = user.longitude ?? DEFAULT_CENTER.longitude;
    setLatitude(String(lat));
    setLongitude(String(lng));
    void runSearch(lat, lng, Number(distance) || 1000, 1, 1);
    getStatsOverview(client).then(setStats).catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!searched) return;
    const lat = Number(latitude);
    const lng = Number(longitude);
    const dist = Number(distance);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    void runSearch(lat, lng, dist, donorPage, requestPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [donorPage, requestPage]);

  const donorPages = Math.max(1, Math.ceil(donorCount / PAGE_SIZE));
  const requestPages = Math.max(1, Math.ceil(requestCount / PAGE_SIZE));

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
        {stats && (
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            <KpiCard label="Open requests" value={String(stats.open_requests)} />
            <KpiCard label="Pending offers" value={String(stats.pending_offers)} />
            <KpiCard label="Accomplished" value={String(stats.accomplished_offers)} />
            <KpiCard
              label="Active donors"
              value={String(stats.donors_by_blood_type.reduce((n, r) => n + r.donors, 0))}
              hint={stats.donors_by_blood_type.map((r) => `${r.blood_type}:${r.donors}`).join(" · ")}
            />
          </div>
        )}

        <Card title="Search area">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void search();
            }}
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(10rem, 1fr))", gap: "0.75rem" }}>
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
              <Button type="submit" loading={busy}>
                Search
              </Button>
              <label style={{ fontSize: "0.85rem" }}>
                <input type="checkbox" checked={showTrueCells} onChange={(e) => setShowTrueCells(e.target.checked)} />{" "}
                Show true H3 hexagons (audit)
              </label>
            </div>
          </form>
          <Alert message={error} />
          {disk && (
            <p style={{ fontSize: "0.85rem", color: "#475569" }}>
              Origin cell <code>{disk.origin.cell_id}</code> <CopyButton value={disk.origin.cell_id} /> ·
              resolution {disk.resolution} · k={disk.k} · showing {disk.cell_count} of {disk.total_cells} cells
              {disk.truncated ? " (truncated)" : ""} · {donorCount} donors · {requestCount} requests.
              Octagons are overlays; matching uses the H3 hexagon disk.
            </p>
          )}
        </Card>

        <Card title="Coverage map">
          <H3Map
            center={mapCenter}
            overlays={overlays}
            trueCells={trueCells}
            markers={markers}
            focusKey={focusKey}
            onPick={(lat, lng) => {
              setLatitude(lat.toFixed(6));
              setLongitude(lng.toFixed(6));
            }}
          />
          <MapLegend />
          <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
            Tip: click anywhere on the map to set the search location, then press Search.
          </p>
        </Card>

        <Card title={`Donors (${donorCount})`}>
          {busy && donors.length === 0 ? (
            <SkeletonList />
          ) : donors.length === 0 ? (
            <EmptyState message={searched ? "No donors in this area." : "Searching nearby donors…"} />
          ) : (
            <>
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
              <Pagination page={donorPage} totalPages={donorPages} onChange={setDonorPage} />
            </>
          )}
        </Card>

        <Card title={`Requests (${requestCount})`}>
          {busy && requests.length === 0 ? (
            <SkeletonList />
          ) : requests.length === 0 ? (
            <EmptyState message={searched ? "No requests in this area." : "Searching nearby requests…"} />
          ) : (
            <>
              <ul>
                {requests.map((r) => (
                  <li key={r.request_id}>
                    <a href={`/requests/${r.request_id}`}>
                      #{r.request_id} {r.blood_type} × {r.requisite_number}
                    </a>{" "}
                    <Badge tone="blue">
                      {REQUEST_STATUS[r.status] ?? r.status} · accepted {r.accepted_count}
                    </Badge>
                  </li>
                ))}
              </ul>
              <Pagination page={requestPage} totalPages={requestPages} onChange={setRequestPage} />
            </>
          )}
        </Card>
      </Page>
    </RequireAuth>
  );
}
