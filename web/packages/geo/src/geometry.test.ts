import { describe, expect, it } from "vitest";

import {
  cellsToFeatureCollection,
  haversineM,
  octagonForCell,
  octagonFromCenter,
  ringFromLatLng,
} from "../src/index.js";

const CENTER = { latitude: 37.7749, longitude: -122.4194 };

describe("octagonFromCenter", () => {
  it("produces eight vertices around the center", () => {
    const vertices = octagonFromCenter(CENTER, 500);
    expect(vertices).toHaveLength(8);
    for (const v of vertices) {
      const d = haversineM(CENTER, v);
      expect(d).toBeGreaterThan(490);
      expect(d).toBeLessThan(510);
    }
  });
});

describe("octagonForCell", () => {
  it("contains the true cell boundary", () => {
    const boundary = octagonFromCenter(CENTER, 400).slice(0, 6);
    const overlay = octagonForCell({ cell_id: "x", resolution: 8, center: CENTER, boundary });
    expect(overlay).toHaveLength(8);
    const overlayRadius = Math.max(...overlay.map((v) => haversineM(CENTER, v)));
    const cellRadius = Math.max(...boundary.map((v) => haversineM(CENTER, v)));
    expect(overlayRadius).toBeGreaterThan(cellRadius);
  });
});

describe("ringFromLatLng", () => {
  it("closes the ring in lng/lat order", () => {
    const ring = ringFromLatLng([
      { latitude: 1, longitude: 2 },
      { latitude: 3, longitude: 4 },
    ]);
    expect(ring[0]).toEqual([2, 1]);
    expect(ring[ring.length - 1]).toEqual(ring[0]);
  });
});

describe("cellsToFeatureCollection", () => {
  it("emits one polygon feature per cell", () => {
    const fc = cellsToFeatureCollection(
      [{ cell_id: "abc", resolution: 8, center: CENTER, boundary: octagonFromCenter(CENTER, 100).slice(0, 6) }],
      "octagon",
    );
    expect(fc.type).toBe("FeatureCollection");
    expect(fc.features).toHaveLength(1);
    expect(fc.features[0].geometry.type).toBe("Polygon");
    expect(fc.features[0].properties.kind).toBe("octagon");
  });
});
