"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MaplibreMap } from "maplibre-gl";

import type { FeatureCollection } from "@bloodheroes/geo";

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  color?: string;
}

const TILE_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

function markersCollection(markers: MapMarker[]): {
  type: "FeatureCollection";
  features: {
    type: "Feature";
    properties: { title: string; color: string };
    geometry: { type: "Point"; coordinates: [number, number] };
  }[];
} {
  return {
    type: "FeatureCollection",
    features: markers.map((marker) => ({
      type: "Feature" as const,
      properties: { title: marker.title, color: marker.color ?? "#7f1d1d" },
      geometry: {
        type: "Point" as const,
        coordinates: [marker.longitude, marker.latitude] as [number, number],
      },
    })),
  };
}

/**
 * MapLibre map rendering authoritative backend geometry. The `overlays`
 * layer is a presentation-only octagon layer; the optional `trueCells`
 * layer shows the exact H3 hexagon boundaries for audit.
 */
export function H3Map({
  center,
  zoom = 12,
  overlays,
  trueCells,
  markers = [],
  onPick,
  height = 420,
}: {
  center: { latitude: number; longitude: number };
  zoom?: number;
  overlays: FeatureCollection;
  trueCells?: FeatureCollection;
  markers?: MapMarker[];
  onPick?: (latitude: number, longitude: number) => void;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      const maplibre = await import("maplibre-gl");
      if (cancelled || !containerRef.current) return;
      const map = new maplibre.Map({
        container: containerRef.current,
        style: TILE_STYLE,
        center: [center.longitude, center.latitude],
        zoom,
      });
      mapRef.current = map;
      map.on("load", () => {
        map.addSource("octagon-overlays", { type: "geojson", data: overlays });
        map.addLayer({
          id: "octagon-fill",
          type: "fill",
          source: "octagon-overlays",
          paint: { "fill-color": "#b91c1c", "fill-opacity": 0.18 },
          filter: ["==", ["get", "kind"], "octagon"],
        });
        map.addLayer({
          id: "octagon-line",
          type: "line",
          source: "octagon-overlays",
          paint: { "line-color": "#b91c1c", "line-width": 2 },
          filter: ["==", ["get", "kind"], "octagon"],
        });
        if (trueCells) {
          map.addSource("true-cells", { type: "geojson", data: trueCells });
          map.addLayer({
            id: "true-cell-line",
            type: "line",
            source: "true-cells",
            paint: { "line-color": "#1d4ed8", "line-width": 1, "line-dasharray": [4, 2] },
          });
        }
        map.addSource("markers", { type: "geojson", data: markersCollection(markers) });
        map.addLayer({
          id: "marker-circles",
          type: "circle",
          source: "markers",
          paint: {
            "circle-radius": 6,
            "circle-color": ["get", "color"],
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 2,
          },
        });
        map.on("click", (e) => pickRef.current?.(e.lngLat.lat, e.lngLat.lng));
        setLoaded(true);
      });
    }
    boot();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      setLoaded(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    const overlaySource = map.getSource("octagon-overlays");
    if (overlaySource && "setData" in overlaySource) {
      (overlaySource as unknown as { setData: (data: unknown) => void }).setData(overlays);
    }
    const markerSource = map.getSource("markers");
    if (markerSource && "setData" in markerSource) {
      (markerSource as unknown as { setData: (data: unknown) => void }).setData(markersCollection(markers));
    }
    const trueSource = map.getSource("true-cells");
    if (trueSource && trueCells && "setData" in trueSource) {
      (trueSource as unknown as { setData: (data: unknown) => void }).setData(trueCells);
    }
  }, [overlays, trueCells, markers, loaded]);

  return <div ref={containerRef} style={{ width: "100%", height }} data-testid="h3-map" />;
}

export function MapLegend() {
  return (
    <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
      Red octagons are presentation overlays. Dashed blue outlines show the authoritative H3
      hexagon when the audit layer is enabled. Overlays never change search results.
    </p>
  );
}
