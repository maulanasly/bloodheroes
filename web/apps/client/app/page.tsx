"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
const PAGE_SIZE = 10;

export default function DiscoveryPage() {
  const { client, user, logout } = useAuth();
  const { notify } = useToast();
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [distance, setDistance] = useState("5000");
  const [bloodType, setBloodType] = useState("");
  const [mode, setMode] = useState<"requests" | "donors">("requests");
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disk, setDisk] = useState<GeoDisk | null>(null);
  const [focusKey, setFocusKey] = useState(0);
  const [page, setPage] = useState(1);
  const [donors, setDonors] = useState<UserOut[]>([]);
  const [donorCount, setDonorCount] = useState(0);
  const [requests, setRequests] = useState<DonationRequestOut[]>([]);
  const [requestCount, setRequestCount] = useState(0);
  const [offering, setOffering] = useState<number | null>(null);
  const autoSearched = useRef(false);

  const overlays = useMemo(
    () => (disk ? cellsToFeatureCollection(disk.cells, "octagon") : EMPTY_COLLECTION),
    [disk],
  );
  const markers: MapMarker[] = useMemo(() => {
    const list = mode === "requests" ? requests : donors;
    return list
      .filter((item) => item.latitude != null && item.longitude != null)
      .map((item) =>
        mode === "requests"
          ? {
              id: `request-${(item as DonationRequestOut).request_id}`,
              latitude: item.latitude as number,
              longitude: item.longitude as number,
              title: `#${(item as DonationRequestOut).request_id} ${(item as DonationRequestOut).blood_type}`,
              color: "#1d4ed8",
              href: `/requests/${(item as DonationRequestOut).request_id}`,
            }
          : {
              id: `donor-${(item as UserOut).user_id}`,
              latitude: item.latitude as number,
              longitude: item.longitude as number,
              title: `${(item as UserOut).firstname} (${(item as UserOut).blood_type ?? "?"})`,
              color: "#b91c1c",
            },
      );
  }, [mode, requests, donors]);

  const mapCenter = useMemo(() => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng) && latitude !== "") {
      return { latitude: lat, longitude: lng };
    }
    if (user?.latitude != null && user?.longitude != null) {
      return { latitude: user.latitude, longitude: user.longitude };
    }
    return { latitude: 37.7749, longitude: -122.4194 };
  }, [latitude, longitude, user]);

  const runSearch = useCallback(
    async (lat: number, lng: number, dist: number, pg: number, searchMode: "requests" | "donors") => {
      setBusy(true);
      setError(null);
      try {
        const geo = await getGeoDisk(client, { latitude: lat, longitude: lng, distance: dist });
        setDisk(geo);
        if (searchMode === "requests") {
          const result = await listDonationRequests(client, {
            latitude: lat,
            longitude: lng,
            distance: dist,
            blood_type: bloodType || undefined,
            page: pg,
            per_page: PAGE_SIZE,
          });
          setRequests(result.donations);
          setRequestCount(result.count);
        } else {
          const result = await listUsers(client, {
            latitude: lat,
            longitude: lng,
            distance: dist,
            blood_type: bloodType || undefined,
            page: pg,
            per_page: PAGE_SIZE,
          });
          setDonors(result.users);
          setDonorCount(result.count);
        }
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
    [client, bloodType, notify],
  );

  const search = useCallback(
    async (pg = 1) => {
      const lat = Number(latitude);
      const lng = Number(longitude);
      const dist = Number(distance);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(dist) || dist <= 0) {
        const message = "Enter a valid latitude, longitude and distance.";
        setError(message);
        notify(message, "error");
        return;
      }
      setPage(pg);
      await runSearch(lat, lng, dist, pg, mode);
    },
    [latitude, longitude, distance, mode, runSearch, notify],
  );

  // Auto-search on first load from the profile location, else a default view.
  useEffect(() => {
    if (autoSearched.current || !user) return;
    autoSearched.current = true;
    const lat = user.latitude ?? 37.7749;
    const lng = user.longitude ?? -122.4194;
    setLatitude(String(lat));
    setLongitude(String(lng));
    void runSearch(lat, lng, Number(distance) || 5000, 1, "requests");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function offer(requestId: number) {
    setError(null);
    setOffering(requestId);
    try {
      await createOffer(client, requestId);
      notify(`Offer sent for request #${requestId}.`, "success");
      const lat = Number(latitude);
      const lng = Number(longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        await runSearch(lat, lng, Number(distance) || 5000, page, mode);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not send offer";
      setError(message);
      notify(message, "error");
    } finally {
      setOffering(null);
    }
  }

  const totalCount = mode === "requests" ? requestCount : donorCount;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

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
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void search(1);
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
              <Field label="Looking for">
                <Select
                  value={mode}
                  onChange={(e) => {
                    setMode(e.target.value as "requests" | "donors");
                    setPage(1);
                  }}
                >
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
              <Button type="submit" loading={busy}>
                Search
              </Button>
            </div>
          </form>
          <Alert message={error} />
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
            focusKey={focusKey}
            onPick={(lat, lng) => {
              setLatitude(lat.toFixed(6));
              setLongitude(lng.toFixed(6));
            }}
          />
          <MapLegend />
          <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
            Tip: click the map to set your search location, or use “Use my location”.
          </p>
        </Card>

        <Card title={mode === "requests" ? `Nearby requests (${requestCount})` : `Nearby donors (${donorCount})`}>
          {busy && (mode === "requests" ? requests.length === 0 : donors.length === 0) ? (
            <SkeletonList />
          ) : mode === "requests" ? (
            requests.length === 0 ? (
              <EmptyState
                message={searched ? "No requests found. Try a wider search." : "Searching nearby requests…"}
                action={
                  searched ? (
                    <a href="/requests/new">
                      <Button variant="secondary">Request blood instead</Button>
                    </a>
                  ) : undefined
                }
              />
            ) : (
              <>
                <ul>
                  {requests.map((r) => (
                    <li key={r.request_id} style={{ marginBottom: "0.5rem" }}>
                      <a href={`/requests/${r.request_id}`}>
                        #{r.request_id} {r.blood_type} × {r.requisite_number}
                      </a>{" "}
                      <Badge tone="blue">accepted {r.accepted_count}</Badge>{" "}
                      <Button
                        variant="ghost"
                        disabled={offering !== null}
                        onClick={() => void offer(r.request_id)}
                      >
                        {offering === r.request_id ? "Sending…" : "Offer to donate"}
                      </Button>
                    </li>
                  ))}
                </ul>
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onChange={(p) => {
                    void search(p);
                  }}
                />
              </>
            )
          ) : donors.length === 0 ? (
            <EmptyState message={searched ? "No donors found. Try a wider search." : "Searching nearby donors…"} />
          ) : (
            <>
              <ul>
                {donors.map((d) => (
                  <li key={d.user_id}>
                    {d.firstname} {d.lastname ?? ""} <Badge tone="red">{d.blood_type ?? "?"}</Badge>
                  </li>
                ))}
              </ul>
              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={(p) => {
                  void search(p);
                }}
              />
            </>
          )}
        </Card>
      </Page>
    </RequireAuth>
  );
}
