import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type {
  CreateListingInput,
  FoodListingResponse,
  UpdateListingInput,
} from "@resqplate/shared";
import { restaurantListingApi } from "../../api/restaurantListing";
import { ListingForm } from "./ListingForm";

export function EditListingPage() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState<FoodListingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadListing() {
      if (!listingId) {
        setError("Missing listing id");
        setIsLoading(false);
        return;
      }

      try {
        const result = await restaurantListingApi.getMyListing(listingId);
        setListing(result.listing);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load listing");
      } finally {
        setIsLoading(false);
      }
    }

    loadListing();
  }, [listingId]);

  async function handleSubmit(input: CreateListingInput | UpdateListingInput) {
    if (!listingId) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await restaurantListingApi.updateListing(
        listingId,
        input as UpdateListingInput,
      );
      navigate("/business/listings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update listing");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="business-form-page">
        <div className="business-form-shell">
          <p className="business-message">Loading listing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="business-form-page">
      <div className="business-form-shell">
        <section className="business-form-card">
          <div className="business-form-header">
            <div>
              <h1>Edit Listing</h1>
              <p>Update pickup time, location, and listing details.</p>
            </div>

            <Link
              className="business-link-button secondary"
              to="/business/listings"
            >
              Back to listings
            </Link>
          </div>

          {error && <p className="business-error">{error}</p>}

          {listing && (
            <ListingForm
              initialValues={{
                title: listing.title,
                description: listing.description ?? "",
                category: listing.category ?? "",
                quantityAvailable: String(listing.quantityAvailable),
                pickupStart: listing.pickupStart,
                pickupEnd: listing.pickupEnd,
                storageNote: listing.storageNote ?? "",
              }}
              submitLabel="Update Listing"
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
            />
          )}
        </section>
      </div>
    </div>
  );
}
