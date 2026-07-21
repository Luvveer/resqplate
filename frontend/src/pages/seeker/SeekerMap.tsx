import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLngBoundsExpression, LatLngTuple } from "leaflet";
import type { PublicListingResponse } from "@resqplate/shared";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

//Match the default icon of leaflet with the marker icon in the vite, the bundle shoudl not overwirt e the path
const markerIconInstance = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  tooltipAnchor: [16, -28],
});

// For a main address use Burnaby, BC
const DEFAULT_CENTER: LatLngTuple = [49.2488, -123.0016];

//Get the cordinates of the listings and return the bounds of the map
type MappableListing = PublicListingResponse & { _lat: number; _lng: number };

//keep only the listings that have valid coordinates and return them as a new array
function toMappable(listings: PublicListingResponse[]): MappableListing[] {
  const out: MappableListing[] = [];
  for (const listing of listings) {
    const rawLat = listing.restaurant?.latitude;
    const rawLng = listing.restaurant?.longitude;
    if (rawLat == null || rawLng == null) continue;
    const lat = Number(rawLat);
    const lng = Number(rawLng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) continue;
    out.push({ ...listing, _lat: lat, _lng: lng });
  }
  return out;
}

//Check to see if the listing has valid coordinates and only keep them
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

// The map component that shows the listings on the map but has to recomute evertime the user uses fullscreen
function InvalidateOnResize({ trigger }: { trigger: boolean }) {
  const map = useMap();
  useEffect(() => {
    const id = window.setTimeout(() => map.invalidateSize(), 0);
    return () => window.clearTimeout(id);
  }, [map, trigger]);
  return null;
}

export function SeekerMap({ listings }: { listings: PublicListingResponse[] }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mappable = useMemo(() => toMappable(listings), [listings]);
  const points = useMemo<LatLngTuple[]>(
    () => mappable.map((listing) => [listing._lat, listing._lng]),
    [mappable],
  );

  const center = points[0] ?? DEFAULT_CENTER;

  return (
    <div
      className={`seeker-map-wrap${isFullscreen ? " seeker-map-wrap--full" : ""}`}
      style={
        isFullscreen
          ? { position: "fixed", inset: 0, zIndex: 1000 }
          : { position: "relative", width: "100%", height: 420 }
      }
    >
      <button
        type="button"
        className="seeker-map-toggle"
        style={{ position: "absolute", top: 12, right: 12, zIndex: 1001 }}
        onClick={() => setIsFullscreen((prev) => !prev)}
      >
        {isFullscreen ? "Exit full screen" : "Full screen"}
      </button>

      {mappable.length === 0 && (
        <p
          className="seeker-map-empty"
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            zIndex: 1001,
            margin: 0,
          }}
        >
          No listings have a location yet.
        </p>
      )}

      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToMarkers points={points} />
        <InvalidateOnResize trigger={isFullscreen} />

        {mappable.map((listing) => (
          <Marker
            key={listing.id}
            position={[listing._lat, listing._lng]}
            icon={markerIconInstance}
          >
            <Popup>
              <strong>{listing.title}</strong>
              <br />
              {listing.restaurant?.businessName}
              <br />
              {listing.restaurant?.address}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
