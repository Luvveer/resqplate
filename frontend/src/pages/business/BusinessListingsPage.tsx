import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { FoodListingResponse } from "@resqplate/shared";
import { restaurantListingApi } from "../../api/restaurantListing";

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
    <div>
      <h1>Food Listings</h1>
      <Link to="/business">Back to dashboard</Link>
      <div>
        <Link to="/business/listings/new">Create Listing</Link>
      </div>

      {error && <p>{error}</p>}

      {isLoading ? (
        <p>Loading...</p>
      ) : listings.length === 0 ? (
        <p>No listings found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Title</th>
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
                  <strong>{listing.title}</strong>
                  <div>{listing.description}</div>
                </td>
                <td>{listing.category || "Uncategorized"}</td>
                <td>{listing.quantityAvailable}</td>
                <td>
                  <div>{new Date(listing.pickupStart).toLocaleString()}</div>
                  <div>{new Date(listing.pickupEnd).toLocaleString()}</div>
                </td>
                <td>{listing.status}</td>
                <td>
                  <Link to={`/business/listings/${listing.id}/edit`}>Edit</Link>
                  <button
                    onClick={() => expireListing(listing.id)}
                    disabled={
                      updatingId === listing.id || listing.status === "EXPIRED"
                    }
                  >
                    Expire
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
