import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLngBoundsExpression, LatLngTuple } from "leaflet";
import type { PublicListingResponse } from "@resqplate/shared";
// import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
// import markerIcon from "leaflet/dist/images/marker-icon.png";
// import markerShadow from "leaflet/dist/images/marker-shadow.png";

//Match the new amber teardrop pin as an inline-SVG divIcon
const markerIconInstance = L.divIcon({
  className: "sk-pin",
  html: `<svg width="30" height="38" viewBox="0 0 30 38" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 37C15 37 28 22.5 28 14A13 13 0 1 0 2 14C2 22.5 15 37 15 37Z"
      fill="#e39a16" stroke="#211e18" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="15" cy="14" r="4.5" fill="#211e18"/>
  </svg>`,
  iconSize: [30, 38],
  iconAnchor: [15, 37],
  popupAnchor: [0, -32],
});

// For a main address use Burnaby, BC
const DEFAULT_CENTER: LatLngTuple = [49.2488, -123.0016];

//Ensure that there is one marker per restaurant, even if there are multiple listings for that restaurant. Use the first listing for that restaurant to get the coordinates.
interface RestaurantMarker {
  restaurantId: string;
  businessName: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  listings: PublicListingResponse[];
}

// edge case for empty and non-finite values
function parseCoordinate(value: string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolvePoint(
  listing: PublicListingResponse,
): { lat: number; lng: number } | null {
  type RawCoordinate = string | null | undefined;
  const candidates: [RawCoordinate, RawCoordinate][] = [
    [listing.latitude, listing.longitude],
    [listing.restaurant?.latitude, listing.restaurant?.longitude],
  ];

  for (const [rawLat, rawLng] of candidates) {
    const lat = parseCoordinate(rawLat);
    const lng = parseCoordinate(rawLng);
    if (lat !== null && lng !== null) {
      return { lat, lng };
    }
  }
  return null;
}

// Function to collapse the feed into one per restaurant
function toRestaurantMarkers(
  listings: PublicListingResponse[],
): RestaurantMarker[] {
  const byRestaurant = new Map<string, RestaurantMarker>();
  for (const listing of listings) {
    const restaurant = listing.restaurant;
    if (!restaurant) continue;
    const point = resolvePoint(listing);
    if (point === null) continue;
    const existing = byRestaurant.get(restaurant.id);
    if (existing) {
      existing.listings.push(listing);
      continue;
    }
    byRestaurant.set(restaurant.id, {
      restaurantId: restaurant.id,
      businessName: restaurant.businessName,
      address: restaurant.address,
      city: restaurant.city,
      lat: point.lat,
      lng: point.lng,
      listings: [listing],
    });
  }
  return [...byRestaurant.values()];
}

// Make it sure that it fit the viewport to every marker whenever the set changes (empty-safe).
function FitToMarkers({ points }: { points: LatLngTuple[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }
    const bounds: LatLngBoundsExpression = points;
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, points]);
  return null;
}

// Leaflet mis-sizes its canvas when the container resizes while mounted
function InvalidateOnResize({ trigger }: { trigger: boolean }) {
  const map = useMap();
  useEffect(() => {
    const id = window.setTimeout(() => map.invalidateSize(), 0);
    return () => window.clearTimeout(id);
  }, [map, trigger]);
  return null;
}

export function SeekerMap({
  listings,
  onSelectRestaurant,
}: {
  listings: PublicListingResponse[];
  // Called when the seeker asks to see a restaurant's listings. Optional so
  // the map still renders standalone.
  onSelectRestaurant?: (restaurantId: string) => void;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const markers = useMemo(() => toRestaurantMarkers(listings), [listings]);
  const points = useMemo<LatLngTuple[]>(
    () => markers.map((marker) => [marker.lat, marker.lng]),
    [markers],
  );

  const center = points[0] ?? DEFAULT_CENTER;

  return (
    <div className={`sk-mapwrap${isFullscreen ? " sk-mapwrap-full" : ""}`}>
      <button
        type="button"
        className="sk-map-toggle"
        onClick={() => setIsFullscreen((prev) => !prev)}
      >
        {isFullscreen ? "Exit full screen" : "Full screen"}
      </button>

      {markers.length === 0 && (
        <p className="sk-map-empty rq-mono">No listings have a location yet.</p>
      )}

      <MapContainer center={center} zoom={13} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToMarkers points={points} />
        <InvalidateOnResize trigger={isFullscreen} />

        {markers.map((marker) => (
          <Marker
            key={marker.restaurantId}
            position={[marker.lat, marker.lng]}
            icon={markerIconInstance}
          >
            <Popup>
              <strong className="sk-pop-name">{marker.businessName}</strong>
              <span className="sk-pop-addr">
                {marker.address}, {marker.city}
              </span>

              <ul className="sk-pop-list">
                {marker.listings.map((listing) => (
                  <li key={listing.id}>
                    {listing.title} — {listing.quantityAvailable} left
                    {listing.distanceKm != null &&
                      ` · ${listing.distanceKm} km`}
                  </li>
                ))}
              </ul>

              {onSelectRestaurant && (
                <button
                  type="button"
                  className="sk-pop-btn"
                  onClick={() => onSelectRestaurant(marker.restaurantId)}
                >
                  {marker.listings.length === 1
                    ? "View this listing"
                    : `View these ${marker.listings.length} listings`}
                </button>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
