import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { CreateListingInput, UpdateListingInput } from "@resqplate/shared";
import { restaurantListingApi } from "../../api/restaurantListing";
import { ListingForm } from "./ListingForm";

export function CreateListingPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(
    input: CreateListingInput | UpdateListingInput,
    imageFile: File | null,
  ) {
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await restaurantListingApi.createListing(
        input as CreateListingInput,
      );

      if (imageFile) {
        await restaurantListingApi.uploadListingImage(
          result.listing.id,
          imageFile,
        );
      }
      navigate("/business/listings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create listing");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="business-form-page">
      <div className="business-form-shell">
        <section className="business-form-card">
          <div className="business-form-header">
            <div>
              <h1>Create Listing</h1>
              <p>Add pickup details for a new food listing.</p>
            </div>

            <Link
              className="business-link-button secondary"
              to="/business/listings"
            >
              Back to listings
            </Link>
          </div>

          {error && <p className="business-error">{error}</p>}

          <ListingForm
            submitLabel="Create Listing"
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
          />
        </section>
      </div>
    </div>
  );
}
