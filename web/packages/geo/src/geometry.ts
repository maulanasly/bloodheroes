export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface GeoCellLike {
  cell_id: string;
  resolution: number;
  center: LatLng;
  boundary: LatLng[];
}

export type Position = [number, number];

export interface PolygonFeature {
  type: "Feature";
  properties: Record<string, string | number | boolean>;
  geometry: {
    type: "Polygon";
    coordinates: Position[][];
  };
}

export interface FeatureCollection {
  type: "FeatureCollection";
  features: PolygonFeature[];
}

const EARTH_RADIUS_M = 6_371_008.8;

export function haversineM(a: LatLng, b: LatLng): number {
  const phi1 = (a.latitude * Math.PI) / 180;
  const phi2 = (b.latitude * Math.PI) / 180;
  const dPhi = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLambda = ((b.longitude - a.longitude) * Math.PI) / 180;
  const h =
    Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/**
 * Build a regular octagon (presentation overlay only) around a center point.
 * The octagon does NOT change search or matching semantics — the authoritative
 * geometry remains the backend H3 hexagon. Vertices start at 22.5° so the
 * octagon has flat top/bottom edges.
 */
export function octagonFromCenter(center: LatLng, radiusM: number): LatLng[] {
  const latRad = (center.latitude * Math.PI) / 180;
  const dLat = (radiusM / EARTH_RADIUS_M) * (180 / Math.PI);
  const dLng = (radiusM / (EARTH_RADIUS_M * Math.max(Math.cos(latRad), 1e-6))) * (180 / Math.PI);
  const vertices: LatLng[] = [];
  for (let i = 0; i < 8; i += 1) {
    const angle = ((22.5 + i * 45) * Math.PI) / 180;
    vertices.push({
      latitude: center.latitude + dLat * Math.sin(angle),
      longitude: center.longitude + dLng * Math.cos(angle),
    });
  }
  return vertices;
}

/**
 * Derive a presentation octagon sized from an authoritative H3 cell boundary.
 * Radius = max vertex distance from the center, slightly expanded so the
 * overlay visibly contains the true cell.
 */
export function octagonForCell(cell: GeoCellLike, paddingFactor = 1.05): LatLng[] {
  const radiusM = Math.max(...cell.boundary.map((v) => haversineM(cell.center, v)));
  return octagonFromCenter(cell.center, radiusM * paddingFactor);
}

export function ringFromLatLng(points: LatLng[]): Position[] {
  const ring = points.map((p) => [p.longitude, p.latitude] as Position);
  if (ring.length > 0) {
    const [first] = ring;
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) ring.push([first[0], first[1]]);
  }
  return ring;
}

export function polygonFeature(
  points: LatLng[],
  properties: Record<string, string | number | boolean>,
): PolygonFeature {
  return { type: "Feature", properties, geometry: { type: "Polygon", coordinates: [ringFromLatLng(points)] } };
}

export function cellsToFeatureCollection(
  cells: GeoCellLike[],
  kind: "h3" | "octagon",
): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: cells.map((cell) =>
      polygonFeature(kind === "octagon" ? octagonForCell(cell) : cell.boundary, {
        kind,
        cell_id: cell.cell_id,
        resolution: cell.resolution,
      }),
    ),
  };
}
