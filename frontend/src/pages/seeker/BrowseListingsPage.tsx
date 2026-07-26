import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { PublicListingResponse, PickupSlot } from "@resqplate/shared";
import { listingsApi } from "../../api/listings";
import { reservationsApi } from "../../api/reservations";
import { useAuth } from "../../auth/useAuth";
import "./Seeker.css";
import { generatePickupSlots } from "@resqplate/shared";
import { getAssetUrl } from "../../api/assets";
import { SeekerMap } from "./SeekerMap";
import { searchListingIds } from "../../external-services/algolia/algolia.search";

// Here is the seeker's origin point
type Origin = { lat: number; lng: number };

//Function for seeker's local time zone to be used for the pickup window
function formatSlot(slot: PickupSlot): string {
  const options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
  };
  return `${slot.start.toLocaleTimeString([], options)} - ${slot.end.toLocaleTimeString([], options)}`;
}

export function BrowseListingsPage() {
  const { logout } = useAuth();
  const [listings, setListings] = useState<PublicListingResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  //toggle between the map and the list view
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // The seeker's origin point
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [radiusKm, setRadiusKm] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  //Only show the restaurant listing after the map popup
  const [focusedRestaurantId, setFocusedRestaurantId] = useState<string | null>(
    null,
  );

  //The filter input
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [matchingListingIds, setMatchingListingIds] = useState<string[] | null>(
    null,
  );
  const [isSearching, setIsSearching] = useState(false);

  // per-listing reserve state
  const [reservingId, setReservingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<Record<string, string>>(
    {},
  ); // mapping of listingId to selected pickup slot start time

  //load listing
  async function loadListings(nextOrigin: Origin | null = origin) {
    setError(null);
    setIsLoading(true);
    try {
      const result = await listingsApi.browse({
        // only send the non-empty filters to the API
        ...(city.trim() ? { city: city.trim() } : {}),
        ...(category.trim() ? { category: category.trim() } : {}),
        //For the map
        ...(nextOrigin
          ? {
              lat: nextOrigin.lat,
              lng: nextOrigin.lng,
              sort: "distance" as const,
            }
          : {}),
        ...(nextOrigin && radiusKm ? { radiusKm: Number(radiusKm) } : {}),
      });
      setListings(result.listings);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Sorry!! failed to load listings",
      );
    } finally {
      setIsLoading(false);
    }
  }

  // Use the location from the browser and then resort the listing
  function handleUseMyLocation() {
    if (!("geolocation" in navigator)) {
      setError(
        "Sorry !! The needed geolocation support is not supported by your browser.",
      );
      return;
    }
    setIsLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next: Origin = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setOrigin(next);
        setFocusedRestaurantId(null);
        setIsLocating(false);
        loadListings(next);
      },
      (geoError) => {
        setIsLocating(false);
        setError(
          geoError.code === geoError.PERMISSION_DENIED
            ? "Sorry !! You denied the location access. Please allow it to use this feature."
            : "Sorry !! Failed to get your location. Please try again.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  //The dropback to the default listings
  function handleClearLocation() {
    setOrigin(null);
    setRadiusKm("");
    setFocusedRestaurantId(null);
    loadListings(null); // not to reply on the state that we just set incase
  }

  const searchedListings =
    matchingListingIds === null
      ? listings
      : (() => {
          const listingsById = new Map(
            listings.map((listing) => [listing.id, listing]),
          );
          return matchingListingIds
            .map((listingId) => listingsById.get(listingId))
            .filter(
              (listing): listing is PublicListingResponse =>
                listing !== undefined,
            );
        })();

  // Recalculated after everypopup
  const visibleListings = focusedRestaurantId
    ? searchedListings.filter(
        (listing) => listing.restaurant?.id === focusedRestaurantId,
      )
    : searchedListings;

  const focusedRestaurantName =
    searchedListings.find(
      (listing) => listing.restaurant?.id === focusedRestaurantId,
    )?.restaurant?.businessName ?? "this restaurant";

  // ask to only see one restaurant food, so make the list view
  function handleSelectRestaurant(restaurantId: string) {
    setFocusedRestaurantId(restaurantId);
    setViewMode("list");
  }

  // Initial load on mount
  useEffect(() => {
    let cancelled = false;

    listingsApi
      .browse({})
      .then((result) => {
        if (!cancelled) setListings(result.listings);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Sorry!! failed to load listings",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    }; // Cleanup function to prevent state updates if like the user navigates away before the API call completes
  }, []);

  async function handleReserve(listingId: string) {
    const slotStart = selectedSlots[listingId];
    if (!slotStart) {
      setNotice("You have to select a pickup slot before reserving.");
      return;
    }
    setNotice(null);
    setReservingId(listingId);
    setError(null);
    try {
      const { reservation } = await reservationsApi.create(
        listingId,
        new Date(slotStart),
      );
      setNotice(
        ` Yes !! Reservation successful! Your pickup code is: ${reservation.pickupCodeDisplay}`,
      );
      // clear the choice after a successful reservation
      setSelectedSlots((prev) => {
        const next = { ...prev };
        delete next[listingId];
        return next;
      });
      await loadListings(); // Refresh the listings to reflect the updated quantity
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Sorry!! failed to create reservation",
      );
    } finally {
      setReservingId(null);
    }
  }

  async function handleAlgoliaSearch(): Promise<void> {
    const normalizedsearch = search.trim();

    setFocusedRestaurantId(null);
    setError(null);

    if (!normalizedsearch) {
      setMatchingListingIds(null);
      return;
    }

    setIsSearching(true);

    try {
      const listingIds = await searchListingIds(normalizedsearch);
      setMatchingListingIds(listingIds);
      setViewMode("list");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to search food listings",
      );
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="seeker-page">
      <header className="seeker-topbar">
        <div className="seeker-brand">
          <h1>Available Food</h1>
          <p>Browse and reserve surplus food near you.</p>
        </div>
        <form
          className="seeker-header-search"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            void handleAlgoliaSearch();
          }}
        >
          <label className="sr-only" htmlFor="listing-search">
            Search food listings
          </label>
          <input
            id="listing-search"
            className="seeker-input seeker-search-input"
            type="search"
            placeholder="Search food or restaurants"
            value={search}
            onChange={(event) => {
              const nextSearch = event.target.value;

              setSearch(nextSearch);

              if (!nextSearch.trim()) {
                setMatchingListingIds(null);
                setFocusedRestaurantId(null);
              }
            }}
          />
          <button
            className="seeker-button"
            type="submit"
            disabled={isSearching}
          >
            {isSearching ? "Searching.." : "Search"}
          </button>
        </form>
        <div className="seeker-actions">
          <button
            className="seeker-link-button secondary"
            onClick={() =>
              setViewMode((mode) => (mode === "list" ? "map" : "list"))
            }
          >
            {viewMode === "list" ? "Map view" : "List view"}
          </button>
          <Link
            className="seeker-link-button secondary"
            to="/seeker/reservations"
          >
            My Reservations
          </Link>
          <Link className="seeker-link-button secondary" to="/seeker/profile">
            My Profile
          </Link>
          <button className="seeker-button" onClick={() => logout()}>
            Logout
          </button>
        </div>
      </header>

      <main className="seeker-main">
        {/* Filters */}
        <section className="seeker-filters">
          <input
            className="seeker-input"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <input
            className="seeker-input"
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          {/* Radius is meaningless without an origin, so it stays disabled
              until the seeker shares a location. */}
          <select
            className="seeker-input"
            value={radiusKm}
            onChange={(e) => setRadiusKm(e.target.value)}
            disabled={!origin}
          >
            <option value="">Any distance</option>
            <option value="2">Within 2 km</option>
            <option value="5">Within 5 km</option>
            <option value="10">Within 10 km</option>
            <option value="25">Within 25 km</option>
          </select>

          <button
            className="seeker-button"
            onClick={() => handleUseMyLocation()}
            disabled={isLocating}
          >
            {isLocating ? "Locating..." : "Near me"}
          </button>

          {origin && (
            <button
              className="seeker-link-button secondary"
              onClick={() => handleClearLocation()}
            >
              Clear location
            </button>
          )}

          <button
            className="seeker-button"
            onClick={() => {
              setFocusedRestaurantId(null);
              loadListings();
            }}
          >
            Apply Filters
          </button>
        </section>

        <p className="seeker-muted">
          Allergen information is provided by restaurant. Cross-contamination
          may be possible
        </p>

        {origin && (
          <p className="seeker-muted">Sorted by distance from your location.</p>
        )}

        {notice && <p className="seeker-notice">{notice}</p>}
        {error && <p className="seeker-error">{error}</p>}

        {isLoading ? (
          <p className="seeker-message">Loading listings...</p>
        ) : searchedListings.length === 0 ? (
          <section className="seeker-card">
            <h2>No listings found</h2>
            <p className="seeker-muted">
              Try clearing your filters or check back later.
            </p>
          </section>
        ) : viewMode === "map" ? (
          // The map always receives the full feed, never the focused subset,
          // otherwise focusing one restaurant would erase the other markers.
          <SeekerMap
            listings={searchedListings}
            onSelectRestaurant={handleSelectRestaurant}
          />
        ) : (
          <>
            {focusedRestaurantId && (
              <div className="seeker-focus-banner">
                <p className="seeker-muted">
                  Showing listings from {focusedRestaurantName}.
                </p>
                <button
                  className="seeker-link-button secondary"
                  onClick={() => setFocusedRestaurantId(null)}
                >
                  Show all restaurants
                </button>
              </div>
            )}

            {/* The outer guard only knows the feed is non-empty. Focusing a
                restaurant can still narrow it to nothing — e.g. its last item
                was reserved by someone else between load and click. */}
            {visibleListings.length === 0 ? (
              <section className="seeker-card">
                <h2>No listings from this restaurant</h2>
                <p className="seeker-muted">
                  They may have just been reserved. Try showing all restaurants.
                </p>
              </section>
            ) : (
              <div className="seeker-grid">
                {visibleListings.map((listing) => {
                  // Same shared function the backend validates against, so the
                  // dropdown can never offer a slot the server would reject.
                  const slots = generatePickupSlots(
                    listing.pickupStart,
                    listing.pickupEnd,
                  );

                  return (
                    <article key={listing.id} className="seeker-card">
                      {listing.imagePath && (
                        <img
                          className="seeker-listing-image"
                          src={getAssetUrl(listing.imagePath) ?? undefined}
                          alt={listing.title}
                        />
                      )}
                      <h2>{listing.title}</h2>
                      <p className="seeker-muted">
                        {listing.restaurant?.businessName ?? "Unknown"} ·{" "}
                        {listing.restaurant?.city ?? ""}
                      </p>

                      {/* distanceKm is number | null | undefined, so `!= null`
                          rules out both null and undefined in one check. */}
                      {listing.distanceKm != null && (
                        <p className="seeker-muted">
                          {listing.distanceKm} km away
                        </p>
                      )}

                      <p>{listing.description || "No description"}</p>

                      <dl className="seeker-meta">
                        <div>
                          <dt>Category</dt>
                          <dd>{listing.category || "Uncategorized"}</dd>
                        </div>
                        <div>
                          <dt>Available</dt>
                          <dd>{listing.quantityAvailable}</dd>
                        </div>
                        <div>
                          <dt>Pickup window</dt>
                          <dd>
                            {new Date(listing.pickupStart).toLocaleString()} –{" "}
                            {new Date(listing.pickupEnd).toLocaleString()}
                          </dd>
                        </div>
                      </dl>

                      <p className="seeker-allergens">
                        {listing.allergens && listing.allergens.length > 0
                          ? `Contains: ${listing.allergens
                              .map((a) => a.name)
                              .join(", ")}`
                          : "No allergen"}
                      </p>

                      {/* Slot picker. If every slot has already passed there's
                          nothing to reserve, so show a message instead. */}
                      {slots.length === 0 ? (
                        <p className="seeker-muted">
                          No pickup times remaining for this listing.
                        </p>
                      ) : (
                        <>
                          <label className="seeker-slot-label">
                            Choose a pickup time
                            <select
                              className="seeker-input"
                              value={selectedSlots[listing.id] ?? ""}
                              onChange={(e) =>
                                setSelectedSlots((prev) => ({
                                  ...prev,
                                  [listing.id]: e.target.value,
                                }))
                              }
                            >
                              <option value="">Select a time...</option>
                              {slots.map((slot) => (
                                <option
                                  key={slot.start.toISOString()}
                                  value={slot.start.toISOString()}
                                >
                                  {formatSlot(slot)}
                                </option>
                              ))}
                            </select>
                          </label>

                          <button
                            className="seeker-button"
                            onClick={() => handleReserve(listing.id)}
                            disabled={
                              reservingId === listing.id ||
                              !selectedSlots[listing.id]
                            }
                          >
                            {reservingId === listing.id
                              ? "Reserving..."
                              : "Reserve"}
                          </button>
                        </>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
