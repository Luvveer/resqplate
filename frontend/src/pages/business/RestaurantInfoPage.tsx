import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import { companyApi } from "../../api/restaurant";

export function RestaurantInfoPage() {
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, SetIsSubmitting] = useState(false);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    SetIsSubmitting(true);
    try {
      await companyApi.createRestaurant({
        businessName,
        address,
        city,
        province,
        postalCode,
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

            <div className="business-field">
              <label htmlFor="address">Address</label>
              <input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>

            <div className="business-form-grid">
              <div className="business-field">
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>

              <div className="business-field">
                <label htmlFor="province">Province</label>
                <input
                  id="province"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  required
                />
              </div>

              <div className="business-field">
                <label htmlFor="postalCode">Postal Code</label>
                <input
                  id="postalCode"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  required
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

            <button
              className="business-button"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
