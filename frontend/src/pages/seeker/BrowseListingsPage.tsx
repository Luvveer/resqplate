import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { PublicListingResponse } from "@resqplate/shared";
import { listingsApi } from "../../api/listings";
import { reservationsApi } from "../../api/reservations";
import { useAuth } from "../../auth/useAuth";
// import "./Seeker.css";

export function BrowseListingsPage() {
  const { logout } = useAuth();
  const [listings, setListings] = useState<PublicListingResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  //The filter input
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");

  // per-listing reserve state
  const [reservingId, setReservingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  //load listing
  async function loadListings() {
    setError(null);
    setIsLoading(true);
    try {
      const result = await listingsApi.browse({
        // only send the non-empty filters to the API
        ...(city.trim() ? { city: city.trim() } : {}),
        ...(category.trim() ? { category: category.trim() } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
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

  // Initial load on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadListings();
  }, []);

  async function handleReserve(listingId: string) {
    setNotice(null);
    setError(null);
    setReservingId(listingId);
    try {
      const { reservation } = await reservationsApi.create(listingId);
      setNotice(
        `             Yess !! Successfully reserved listing! Pickup code: ${reservation.pickupCodeDisplay ?? "N/A"}`,
      );
      // Optionally, you might want to add a refresh the listings or update the UI to reflect the reservation as well
      await loadListings(); // Refresh listings after reservation attempt
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Sorry!! failed to reserve listing",
      );
    } finally {
      setReservingId(null);
    }
  }

  return (
    <div className="seeker-page">
      <header className="seeker-topbar">
        <div className="seeker-brand">
          <h1>Available Food</h1>
          <p>Browse and reserve surplus food near you.</p>
        </div>
        <div className="seeker-actions">
          <Link
            className="seeker-link-button secondary"
            to="/seeker/reservations"
          >
            My Reservations
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
          <input
            className="seeker-input"
            placeholder="Search title"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="seeker-button" onClick={() => loadListings()}>
            Apply Filters
          </button>
        </section>

        {notice && <p className="seeker-notice">{notice}</p>}
        {error && <p className="seeker-error">{error}</p>}

        {isLoading ? (
          <p className="seeker-message">Loading listings...</p>
        ) : listings.length === 0 ? (
          <section className="seeker-card">
            <h2>No listings found</h2>
            <p className="seeker-muted">
              Try clearing your filters or check back later.
            </p>
          </section>
        ) : (
          <div className="seeker-grid">
            {listings.map((listing) => (
              <article key={listing.id} className="seeker-card">
                <h2>{listing.title}</h2>
                <p className="seeker-muted">
                  {listing.restaurant?.businessName ?? "Unknown"} ·{" "}
                  {listing.restaurant?.city ?? ""}
                </p>
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
                    <dt>Pickup by</dt>
                    <dd>{new Date(listing.pickupEnd).toLocaleString()}</dd>
                  </div>
                </dl>

                {listing.allergens && listing.allergens.length > 0 && (
                  <p className="seeker-allergens">
                    Contains: {listing.allergens.map((a) => a.name).join(", ")}
                  </p>
                )}

                <button
                  className="seeker-button"
                  onClick={() => handleReserve(listing.id)}
                  disabled={reservingId === listing.id}
                >
                  {reservingId === listing.id ? "Reserving..." : "Reserve"}
                </button>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
