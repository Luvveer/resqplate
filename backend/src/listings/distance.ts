const EARTH_RADIUS_KM = 6371;

function toRadians(degree: number): number {
  return (degree * Math.PI) / 180;
}

//streight line distance between two points on the earth's surface
export function haversineKm(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): number {
  const deltaLat = toRadians(toLat - fromLat);
  const deltaLng = toRadians(toLng - fromLng);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  // Calculate the great circle distance
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

// Number that is "" is 0 and then a xyz is NaN
export function parseCoordinate(value: string | null): number | null {
  if (value === null) return null;
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

// The interface that makes sure that ther is no problems in the minimal shape a listing needs to be placable
export interface CoordinateSource {
  latitude: string | null;
  longitude: string | null;
  restaurant: {
    latitude: string | null;
    longitude: string | null;
  } | null;
}

export interface Coordinate {
  lat: number;
  lng: number;
}

// Resolution of a point a listing should be measured from

export function resolveListingCoordinate(
  listing: CoordinateSource,
): Coordinate | null {
  const candidates: Array<[string | null, string | null]> = [
    [listing.latitude, listing.longitude],
    [
      listing.restaurant?.latitude ?? null,
      listing.restaurant?.longitude ?? null,
    ],
  ];

  for (const [rawLat, rawLng] of candidates) {
    const lat = parseCoordinate(rawLat);
    const lng = parseCoordinate(rawLng);
    // you should keep track of both the thing not just one
    if (lat !== null && lng !== null) {
      return { lat, lng };
    }
  }
  return null;
}

// display not working so rounding to one decimal place for now, but this is not the best way to do it
export function roundKm(km: number): number {
  return Math.round(km * 10) / 10;
}
