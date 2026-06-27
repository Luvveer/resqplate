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
    <form onSubmit={handleSubmit}>
      <h1>Tell us about your restraunt</h1>
      <div>
        <label htmlFor="businessName">Business name</label>
        <input
          id="businessName"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="address">Address</label>
        <input
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="city">City</label>
        <input
          id="city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="province">Province</label>
        <input
          id="province"
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="postalCode">Postal Code</label>
        <input
          id="postalCode"
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="phone">Phone No</label>
        <input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="description">Description</label>
        <input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      {error && <p>{error}</p>}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "saving..." : "Save"}
      </button>
    </form>
  );
}
