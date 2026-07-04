import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { CreateListingInput, UpdateListingInput } from "@resqplate/shared";
import { restaurantListingApi } from "../../api/restaurantListing";
import { ListingForm } from "./ListingForm";

export function CreateListingPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(input: CreateListingInput | UpdateListingInput) {
    setError(null);
    setIsSubmitting(true);

    try {
      await restaurantListingApi.createListing(input as CreateListingInput);
      navigate("/business/listings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create listing");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h1>Create Listing</h1>
      <Link to="/business/listings">Back to listings</Link>
      {error && <p>{error}</p>}
      <ListingForm
        submitLabel="Create Listing"
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
