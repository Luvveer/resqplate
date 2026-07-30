import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import { companyApi } from "../../api/restaurant";
import { AddressAutocomplete } from "./AddressAutocomplete";

export function RestaurantInfoPage() {
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [sessionToken] = useState(() => crypto.randomUUID());
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, SetIsSubmitting] = useState(false);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!placeId) {
      setError("Please select address from suggestions");
      SetIsSubmitting(false);
      return;
    }
    setError(null);
    SetIsSubmitting(true);
    try {
      await companyApi.createRestaurant({
        businessName,
        placeId,
        sessionToken,
        phone: phone || undefined,
        description: description || undefined,
      });
      navigate("/business");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create restaurant profile",
      );
    } finally {
      SetIsSubmitting(false);
    }
  }
  return (
    <div className="business-form-page">
      <div className="business-form-shell">
        <section className="business-form-card">
          <div className="business-form-header">
            <div>
              <h1>Tell us about your restaurant</h1>
              <p>
                Your profile will be reviewed by admin before you can create
                listings.
              </p>
            </div>
          </div>

          {error && <p className="business-error">{error}</p>}
          <div className="business-form-body">
            <form className="business-form" onSubmit={handleSubmit}>
              <div className="business-field">
                <label htmlFor="businessName">Business name</label>
                <input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                />
              </div>

              <div className="business-form-grid">
                <div className="business-field">
                  <AddressAutocomplete
                    sessionToken={sessionToken}
                    selectedPlaceId={placeId}
                    required
                    onSelect={(newPlaceId) => {
                      setPlaceId(newPlaceId);
                    }}
                  />
                </div>

                <div className="business-field">
                  <label htmlFor="phone">Phone No.</label>
                  <input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="business-field">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
              <div className="business-form-footer">
                <button
                  className="business-button primary-dark"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
