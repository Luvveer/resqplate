import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { FoodListingResponse } from "@resqplate/shared";
import { restaurantListingApi } from "../../api/restaurantListing";
import "./Business.css";
import { getAssetUrl } from "../../api/assets";

export function BusinessListingsPage() {
  const [listings, setListings] = useState<FoodListingResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadListings() {
    setError(null);
    setIsLoading(true);
    try {
      const result = await restaurantListingApi.getMyListings();
      setListings(result.listings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load listings");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function fetchListings() {
      try {
        setIsLoading(true);
        const response = await restaurantListingApi.getMyListings();
        setListings(response.listings);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load listings",
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchListings();
  }, []);

  async function expireListing(listingId: string) {
    setError(null);
    setUpdatingId(listingId);
    try {
      await restaurantListingApi.expireListing(listingId);
      await loadListings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to expire listing");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="business-page">
      <header className="business-topbar">
        <div className="business-brand">
          <h1>Food Listings</h1>
          <p>Create and manage available pickup listings.</p>
        </div>

        <div className="business-actions">
          <Link className="business-link-button secondary" to="/business">
            Dashboard
          </Link>
          <Link className="business-link-button" to="/business/listings/new">
            Create Listing
          </Link>
        </div>
      </header>

      <main className="business-main">
        {error && <p className="business-error">{error}</p>}

        {isLoading ? (
          <p className="business-message">Loading listings...</p>
        ) : listings.length === 0 ? (
          <section className="business-card">
            <h2>No listings yet</h2>
            <p className="business-muted">
              Create your first food listing when you have food available for
              pickup.
            </p>
            <Link className="business-link-button" to="/business/listings/new">
              Create Listing
            </Link>
          </section>
        ) : (
          <div className="business-table-wrap">
            <table className="business-table">
              <thead>
                <tr>
                  <th>Listing</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Pickup</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {listings.map((listing) => (
                  <tr key={listing.id}>
                    <td>
                      {listing.imagePath && (
                        <img
                          className="business-listing-image"
                          src={getAssetUrl(listing.imagePath) ?? undefined}
                          alt={listing.title}
                        />
                      )}
                      <div className="business-title">{listing.title}</div>
                      <div className="business-muted">
                        {listing.description || "No description"}
                      </div>
                      <div className="business-listing-allergens">
                        <strong>Allergens:</strong>{" "}
                        {listing.allergens && listing.allergens.length > 0
                          ? listing.allergens
                              .map((allergen) => allergen.name)
                              .join(", ")
                          : "No allergen"}
                      </div>
                    </td>

                    <td>{listing.category || "Uncategorized"}</td>

                    <td>{listing.quantityAvailable}</td>

                    <td>
                      <div>
                        {new Date(listing.pickupStart).toLocaleString()}
                      </div>
                      <div className="business-muted">
                        to {new Date(listing.pickupEnd).toLocaleString()}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`business-status ${listing.status.toLowerCase()}`}
                      >
                        {listing.status}
                      </span>
                    </td>

                    <td>
                      <div className="business-actions">
                        <Link
                          className="business-link-button secondary"
                          to={`/business/listings/${listing.id}/edit`}
                        >
                          Edit
                        </Link>

                        <button
                          className="business-button danger"
                          onClick={() => expireListing(listing.id)}
                          disabled={
                            updatingId === listing.id ||
                            listing.status === "EXPIRED"
                          }
                        >
                          Expire
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
