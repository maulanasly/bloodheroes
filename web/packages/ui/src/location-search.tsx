"use client";

import { useEffect, useRef, useState } from "react";

import { Field, Input } from "./components";
import { colors, font } from "./theme";

export interface PickedLocation {
  latitude: number;
  longitude: number;
  label: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

/**
 * Location input combining manual coordinates, browser geolocation, and
 * OpenStreetMap Nominatim address search (debounced, low-volume use).
 */
export function LocationSearch({
  latitude,
  longitude,
  onCoordinates,
  onPick,
}: {
  latitude: string;
  longitude: string;
  onCoordinates: (latitude: string, longitude: string) => void;
  onPick: (location: PickedLocation) => void;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (query.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setSearching(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&addressdetails=0&q=${encodeURIComponent(query.trim())}`,
          { headers: { Accept: "application/json" } },
        );
        if (!res.ok) throw new Error(`Search failed (${res.status})`);
        const data = (await res.json()) as NominatimResult[];
        setSuggestions(data);
        setOpen(true);
      } catch {
        setError("Place search is unavailable right now.");
      } finally {
        setSearching(false);
      }
    }, 450);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  function useMyLocation() {
    setError(null);
    if (!navigator.geolocation) {
      setError("Geolocation is not available in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onPick({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          label: "My location",
        });
      },
      () => {
        setLocating(false);
        setError("Could not read your location. Check browser permissions.");
      },
      { timeout: 10000 },
    );
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(10rem, 1fr))", gap: "0.75rem" }}>
        <Field label="Latitude" error={null}>
          <Input
            value={latitude}
            onChange={(e) => onCoordinates(e.target.value, longitude)}
            inputMode="decimal"
            placeholder="e.g. 37.7749"
          />
        </Field>
        <Field label="Longitude">
          <Input
            value={longitude}
            onChange={(e) => onCoordinates(latitude, e.target.value)}
            inputMode="decimal"
            placeholder="e.g. -122.4194"
          />
        </Field>
      </div>
      <div style={{ position: "relative", marginBottom: "0.75rem" }}>
        <Field label="Search a place">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="City, hospital, landmark…"
            role="combobox"
            aria-expanded={open}
            aria-controls="bh-place-suggestions"
            aria-autocomplete="list"
          />
        </Field>
        {open && suggestions.length > 0 && (
          <ul
            id="bh-place-suggestions"
            role="listbox"
            style={{
              position: "absolute",
              zIndex: 50,
              top: "100%",
              left: 0,
              right: 0,
              margin: 0,
              padding: 0,
              listStyle: "none",
              background: colors.white,
              border: `1px solid ${colors.ink[300]}`,
              borderRadius: "0.5rem",
              boxShadow: "0 8px 24px rgba(15,23,42,0.15)",
              maxHeight: "12rem",
              overflowY: "auto",
            }}
          >
            {suggestions.map((s) => (
              <li key={`${s.lat},${s.lon}`} role="option" aria-selected="false">
                <button
                  type="button"
                  onClick={() => {
                    onPick({ latitude: Number(s.lat), longitude: Number(s.lon), label: s.display_name });
                    setOpen(false);
                    setQuery(s.display_name);
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    background: "transparent",
                    border: "none",
                    padding: "0.5rem 0.75rem",
                    fontSize: font.size.sm,
                    cursor: "pointer",
                  }}
                >
                  {s.display_name}
                </button>
              </li>
            ))}
          </ul>
        )}
        {searching && <span style={{ fontSize: font.size.xs, color: colors.ink[500] }}>Searching places…</span>}
      </div>
      <div style={{ marginBottom: "0.75rem" }}>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          style={{
            background: "transparent",
            border: `1px solid ${colors.ink[700]}`,
            borderRadius: "0.5rem",
            padding: "0.5rem 0.9rem",
            fontWeight: 600,
            cursor: locating ? "wait" : "pointer",
          }}
        >
          {locating ? "Locating…" : "◎ Use my location"}
        </button>
      </div>
      {error && (
        <p role="alert" style={{ color: colors.danger.text, fontSize: font.size.sm }}>
          {error}
        </p>
      )}
    </div>
  );
}
