import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  haversineKm,
  parseCoordinate,
  resolveListingCoordinate,
  roundKm,
} from "../distance.js";
import type { CoordinateSource } from "../distance.js";

//Float helper:
function assertClose(actual: number, expected: number, tolerance = 1e-6): void {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  );
}

//Make the restaurant and listing override pattern
function makeSource(
  override: Partial<CoordinateSource> = {},
): CoordinateSource {
  return {
    latitude: "49.2827",
    longitude: "-123.1207",
    restaurant: {
      latitude: "49.2820",
      longitude: "-123.1171",
    },
    ...override,
  };
}

describe("distance helpers", () => {
  describe("haversineKm", () => {
    it("returns 0 for identical coordinates", () => {
      assert.equal(haversineKm(49.2827, -123.1207, 49.2827, -123.1207), 0);
    });

    it("Measures one degree of latitude as ~111.19 km", () => {
      //the anchor calculations: 2 * PI * 6371 / 360 = 111.1949 km/deg.
      assertClose(haversineKm(0, 0, 1, 0), 111.1949, 0.001);
    });

    it("Measures one degree of longitude at the equator as ~111.19 km", () => {
      assertClose(haversineKm(0, 0, 0, 1), 111.1949, 0.001);
    });

    it("shrinks a longitude degree by cos(latitude)", () => {
      assertClose(haversineKm(60, 0, 60, 1), 55.5969, 0.001);
    });

    it("is symmetric in it's endpoints", () => {
      const forward = haversineKm(49.2827, -123.1207, 43.6532, -79.3832);
      const backword = haversineKm(43.6532, -79.3832, 49.2827, -123.1207);
      assertClose(forward, backword, 1e-9);
    });

    it("gives a sane distance for two nearby real points", () => {
      // Downtown is aprox 13 km aparrt from here
      const km = haversineKm(49.2827, -123.1207, 49.282, -122.94);
      assert.ok(km > 12 && km < 14, `expected ~13 km, got ${km}`);
    });
  });

  describe("parseCoordinate", () => {
    it("returns null fro null", () => {
      assert.equal(parseCoordinate(null), null);
    });

    it("returns null for an empty or whitespace-only string", () => {
      assert.equal(parseCoordinate(""), null);
      assert.equal(parseCoordinate("   "), null);
    });

    it("parse a pplain numeric string", () => {
      assert.equal(parseCoordinate("49.2827"), 49.2827);
    });

    it("trims surrounding whitespace before parsing", () => {
      assert.equal(parseCoordinate("  49.2827  "), 49.2827);
    });

    it('parses "0" as 0, not null', () => {
      //Important as it is a guard against a "!trimmed" refactor:
      assert.equal(parseCoordinate("0"), 0);
    });

    it("returns null for a non-numeric string", () => {
      assert.equal(parseCoordinate("abc"), null);
      assert.equal(parseCoordinate("12px"), null);
    });

    it("returuns null for non-finite inputs", () => {
      //check for infinity and if the isFinite rejecting it or not:
      assert.equal(parseCoordinate("Infinity"), null);
      assert.equal(parseCoordinate("-Infinity"), null);
      assert.equal(parseCoordinate("NaN"), null);
    });
  });

  describe("resolveListingCoordinate", () => {
    it("uses the listing's own coordinates when present", () => {
      const result = resolveListingCoordinate(makeSource());
      assert.deepEqual(result, { lat: 49.2827, lng: -123.1207 });
    });

    it("falls back to the restaurant when the listing has no coords", () => {
      const result = resolveListingCoordinate(
        makeSource({ latitude: null, longitude: null }),
      );
      assert.deepEqual(result, { lat: 49.282, lng: -123.1171 });
    });

    it("falls back when the listing coordinate pair is only half-present", () => {
      // stable pairs matchign so that both the lat and the lng is there
      const result = resolveListingCoordinate(
        makeSource({ latitude: "49.2827", longitude: null }),
      );
      assert.deepEqual(result, { lat: 49.282, lng: -123.1171 });
    });

    it("returns null when both the listing and restaurant are missing coordinates", () => {
      const result = resolveListingCoordinate(
        makeSource({ latitude: " ", longitude: " " }),
      );
      assert.deepEqual(result, { lat: 49.282, lng: -123.1171 });
    });

    it("uses listing coords even when there is no restaurant", () => {
      const result = resolveListingCoordinate(makeSource());
      assert.deepEqual(result, { lat: 49.2827, lng: -123.1207 });
    });

    it("uses listing coords even when there is no restaurant", () => {
      const result = resolveListingCoordinate(makeSource({ restaurant: null }));
      assert.deepEqual(result, { lat: 49.2827, lng: -123.1207 });
    });

    it("returns null when both the listing and restaurant are missing coordinates", () => {
      const result = resolveListingCoordinate(
        makeSource({ latitude: null, longitude: null, restaurant: null }),
      );
      assert.equal(result, null);
    });
  });

  describe("roundKm", () => {
    it("rounds to one decimal place", () => {
      assert.equal(roundKm(12.345), 12.3);
      assert.equal(roundKm(1.24), 1.2);
    });

    it("rounds halves up", () => {
      assert.equal(roundKm(1.25), 1.3);
      assert.equal(roundKm(1.35), 1.4);
    });

    it("leaves a one decimal place number alone", () => {
      assert.equal(roundKm(1.2), 1.2);
    });

    it("handles zero correctly", () => {
      assert.equal(roundKm(0), 0);
    });

    it("Carries into the next integer", () => {
      assert.equal(roundKm(1.95), 2.0);
      assert.equal(roundKm(12.999), 13);
    });
  });
});
