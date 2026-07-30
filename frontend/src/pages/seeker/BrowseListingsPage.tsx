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

// Format for the time remaining until the restaurant closes
function formatCloses(pickupEnd: Date | string): string | null {
  const end = new Date(pickupEnd).getTime();
  const diff = end - Date.now();
  if (Number.isNaN(end) || diff <= 0) return null;
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `closes in ${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `Sorry !! Closes in ${h}h` : `closes in ${h}h ${m}m`;
}

//Ui element for the urgency tier drivers the corner pill + the accent
function urgency(pickupEnd: Date | string): "fresh" | "soon" | "last" {
  const diff = new Date(pickupEnd).getTime() - Date.now();
  const mins = diff / 60000;
  if (mins <= 30) return "last";
  if (mins <= 90) return "soon";
  return "fresh";
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
    <div className="sk-page">
      <header className="sk-topbar">
        <div className="sk-brand">
          <span className="sk-brand-mark" aria-hidden="true" />
          <span className="sk-brand-text">
            <b>ResQPlate</b>
          </span>
        </div>

        <form
          className="sk-topsearch"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            void handleAlgoliaSearch();
          }}
        >
          <label className="sr-only" htmlFor="listing-search">
            Search food listings
          </label>
          <span className="sk-topsearch-icon" aria-hidden="true">
            ⌕
          </span>
          <input
            id="listing-search"
            className="sk-topsearch-input"
            type="search"
            placeholder="Search food or restaurants..."
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
            className="sk-topsearch-btn"
            type="submit"
            disabled={isSearching}
          >
            {isSearching ? "..." : "Search"}
          </button>
        </form>

        <nav className="sk-nav">
          <Link className="sk-nav-link is-active" to="/seeker">
            Browse
          </Link>
          <Link className="sk-nav-link" to="/seeker/reservations">
            My Reservations
          </Link>
          <Link className="sk-nav-link" to="/seeker/profile">
            Profile
          </Link>
          <button className="sk-nav-logout" onClick={() => logout()}>
            Logout
          </button>
        </nav>
      </header>

      <main className="sk-main">
        <div className="sk-head">
          <div>
            <h1 className="rq-display sk-title">Tonight's rescues</h1>
            <p className="sk-sub">
              Surplus food from kitchens near you. Reserve an item, pick it up
              before the window closes.
            </p>
          </div>
          {origin && (
            <span className="rq-loc">📍 near you | sorted by distance</span>
          )}
        </div>

        <section className="sk-toolbar">
          <div className="rq-field">
            <label htmlFor="f-city">City</label>
            <input
              id="f-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Any"
            />
          </div>

          <div className="rq-field">
            <label htmlFor="f-cat">Category</label>
            <input
              id="f-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Any"
            />
          </div>

          <div className="rq-field">
            <label htmlFor="f-within">Within</label>
            <select
              id="f-within"
              value={radiusKm}
              onChange={(e) => setRadiusKm(e.target.value)}
              disabled={!origin}
            >
              <option value="">Any distance</option>
              <option value="2">2 km</option>
              <option value="5">5 km</option>
              <option value="10">10 km</option>
              <option value="25">25 km</option>
            </select>
          </div>

          <button
            className="rq-btn rq-btn-ghost"
            onClick={() => handleUseMyLocation()}
            disabled={isLocating}
          >
            {isLocating ? "Locating..." : "Near me"}
          </button>

          {origin && (
            <button
              className="rq-btn rq-btn-ghost"
              onClick={() => handleClearLocation()}
            >
              Clear
            </button>
          )}

          <button
            className="rq-btn rq-btn-primary"
            onClick={() => {
              setFocusedRestaurantId(null);
              loadListings();
            }}
          >
            Apply
          </button>

          <div className="sk-seg-wrap">
            <div className="rq-seg">
              <button
                className={viewMode === "list" ? "on" : ""}
                onClick={() => setViewMode("list")}
              >
                List
              </button>
              <button
                className={viewMode === "map" ? "on" : ""}
                onClick={() => setViewMode("map")}
              >
                Map
              </button>
            </div>
          </div>
        </section>

        <p className="sk-allergen-note">
          ⚠ Allergen info is provided by each kitchen, and remember that
          cross-contamination is possible.
        </p>

        {notice && <p className="rq-notice">{notice}</p>}
        {error && <p className="rq-error">{error}</p>}

        {isLoading ? (
          <p className="sk-message">Loading listings...</p>
        ) : searchedListings.length === 0 ? (
          <section className="rq-card sk-empty">
            <h2 className="rq-display">No listings found</h2>
            <p className="rq-muted">
              Try clearing your filters or check back later.
            </p>
          </section>
        ) : viewMode === "map" ? (
          <SeekerMap
            listings={searchedListings}
            onSelectRestaurant={handleSelectRestaurant}
          />
        ) : (
          <>
            {focusedRestaurantId && (
              <div className="sk-focus">
                <p className="rq-muted">
                  Showing listings from <b>{focusedRestaurantName}</b>.
                </p>
                <button
                  className="rq-btn rq-btn-ghost"
                  onClick={() => setFocusedRestaurantId(null)}
                >
                  Show all restaurants
                </button>
              </div>
            )}

            {visibleListings.length === 0 ? (
              <section className="rq-card sk-empty">
                <h2 className="rq-display">No listings from this restaurant</h2>
                <p className="rq-muted">
                  They may have just been reserved. Try showing all restaurants.
                </p>
              </section>
            ) : (
              <div className="sk-grid">
                {visibleListings.map((listing) => {
                  const slots = generatePickupSlots(
                    listing.pickupStart,
                    listing.pickupEnd,
                  );
                  const tier = urgency(listing.pickupEnd);
                  const closes = formatCloses(listing.pickupEnd);
                  const allergens = listing.allergens ?? [];

                  return (
                    <article key={listing.id} className="sk-card">
                      {/* Media band: image if present, warm gradient fallback
                          otherwise. Urgency pill top-left, distance chip
                          bottom-right - both derived, no server change. */}
                      <div className={`sk-card-media sk-tier-${tier}`}>
                        {listing.imagePath && (
                          <img
                            className="sk-card-img"
                            src={getAssetUrl(listing.imagePath) ?? undefined}
                            alt={listing.title}
                          />
                        )}
                        <span
                          className={`rq-pill sk-tierpill sk-tierpill-${tier}`}
                        >
                          ●{" "}
                          {tier === "last"
                            ? "Last call"
                            : tier === "soon"
                              ? "Going fast"
                              : "Fresh"}
                        </span>
                        {listing.distanceKm != null && (
                          <span className="sk-dist">
                            {listing.distanceKm} km
                          </span>
                        )}
                      </div>

                      <div className="sk-card-body">
                        <h2 className="sk-card-title">{listing.title}</h2>
                        <p className="sk-card-kitchen">
                          <b>{listing.restaurant?.businessName ?? "Unknown"}</b>
                          {listing.restaurant?.city
                            ? ` · ${listing.restaurant.city}`
                            : ""}
                        </p>

                        <div className="sk-card-window">
                          <span className="rq-mono sk-window-time">
                            {new Date(listing.pickupStart).toLocaleTimeString(
                              [],
                              { hour: "numeric", minute: "2-digit" },
                            )}
                            -
                            {new Date(listing.pickupEnd).toLocaleTimeString(
                              [],
                              {
                                hour: "numeric",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                          {closes && (
                            <span
                              className={`sk-window-closes sk-closes-${tier}`}
                            >
                              {closes}
                            </span>
                          )}
                        </div>

                        <p className="sk-card-qty">
                          x{listing.quantityAvailable} left
                        </p>

                        {allergens.length > 0 ? (
                          <div className="sk-card-tags">
                            {allergens.map((a) => (
                              <span key={a.id} className="rq-tag">
                                {a.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="sk-card-tags">
                            <span className="rq-tag">no listed allergens</span>
                          </div>
                        )}
                      </div>

                      {/* Pickup "board": the dark reserve strip from the
                          mockup. Same slot logic and reserve handler. */}
                      <div className="sk-board">
                        {slots.length === 0 ? (
                          <p className="sk-board-none rq-mono">
                            No pickup times remaining
                          </p>
                        ) : (
                          <>
                            <span className="sk-board-label rq-mono">
                              Pickup time
                            </span>
                            <div className="sk-board-row">
                              <select
                                className="sk-board-select"
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
                              <button
                                className="sk-board-btn"
                                onClick={() => handleReserve(listing.id)}
                                disabled={
                                  reservingId === listing.id ||
                                  !selectedSlots[listing.id]
                                }
                              >
                                {reservingId === listing.id
                                  ? "Claiming..."
                                  : "Claim"}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
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
