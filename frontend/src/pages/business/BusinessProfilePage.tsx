import { useEffect, useState, type SubmitEvent } from "react";
import { Link } from "react-router-dom";
import type {
  ProfileResponse,
  RestaurantProfileResponse,
} from "@resqplate/shared";
import { authApi } from "../../api/authClient";
import { AddressAutocomplete } from "./AddressAutocomplete";
import "./Business.css";
import { companyApi } from "../../api/restaurant";
import { useAuth } from "../../auth/useAuth";

export function BusinessProfilePage() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [name, setName] = useState("");
  const [restaurant, setRestaurant] =
    useState<RestaurantProfileResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [businessName, setBusinessName] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [sessionToken] = useState(() => crypto.randomUUID());
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const { setCurrentProfile } = useAuth();

  // check to see the current profile once
  useEffect(() => {
    let cancelled = false;

    Promise.all([authApi.profileMe(), companyApi.getMyRestaurant()])
      .then(([profileResult, restaurantResult]) => {
        if (cancelled) return;
        setProfile(profileResult.profile);
        setName(profileResult.profile.name);
        setRestaurant(restaurantResult.restaurant);
        setBusinessName(restaurantResult.restaurant.businessName);
        setPhone(restaurantResult.restaurant.phone ?? "");
        setDescription(restaurantResult.restaurant.description ?? "");
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load your profile.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Are you sure you want too delete your account? All your data would be permanently removed.",
    );
    if (!confirmed) return;

    setError(null);
    try {
      await authApi.deleteAccount();
      window.location.href = "/login";
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete your account.",
      );
    }
  }

  async function handleSaveRestaurant(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setIsSaving(true);
    try {
      const { restaurant: updated } = await authApi.updateRestaurant({
        businessName,
        phone: phone || undefined,
        description: description || undefined,
        ...(placeId ? { placeId, sessionToken } : {}),
      });
      setRestaurant(updated);
      setNotice("Restaurant details updated.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update restaurant details.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSave() {
    setError(null);
    setNotice(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name cannot be empty.");
      return;
    }

    setIsSaving(true);
    try {
      //Send both fields so that the server and database can update them together. The server will ignore any fields that are not present in the request body.
      const { profile: updated } = await authApi.updateProfile({
        name: trimmedName,
      });
      setCurrentProfile(updated);
      setProfile(updated);
      setName(updated.name);
      setNotice("The Profile is updated successfully");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Sorry !! Failed to update your profile.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="business-page">
      <header className="business-topbar">
        <div className="business-brand">
          <h1>ResQPlate</h1>
          <p>Account & Restaurant Details</p>
        </div>
        <Link className="business-link-button secondary" to="/">
          Dashboard
        </Link>
      </header>

      <main className="business-main business-profile-grid">
        <div className="business-head">
          <div className="business-account-head">
            <h1 className="business-account-title">Account Details</h1>
            <p className="business-account-subtitle">
              Update your profile name and restaurant details
            </p>
          </div>
        </div>

        {notice && <p className="business-notice">{notice}</p>}
        {error && <p className="business-error">{error}</p>}

        {isLoading ? (
          <p className="business-message">Loading your profile...</p>
        ) : !profile ? (
          <section className="business-card sk-empty">
            <h2 className="business-display">Could not load profile</h2>
            <p className="business-muted">Please try again later.</p>
          </section>
        ) : (
          <>
            <section className="business-card business-profile-card">
              <h2>Profile Details</h2>
              <p className="business-profile-email">
                Signed in as {profile.email}
              </p>

              <div className="business-field">
                <label htmlFor="business-profile-name">Name</label>
                <input
                  id="business-profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={255}
                />
              </div>

              <button
                type="button"
                className="business-button primary-dark business-profile-save"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save changes"}
              </button>
              <button
                type="button"
                className="business-button danger business-profile-delete"
                onClick={handleDeleteAccount}
                disabled={isSaving}
              >
                Delete Account
              </button>
            </section>
            <section className="business-card business-restaurant-card">
              <h2>Restaurant Details</h2>
              {restaurant && (
                <form className="business-form" onSubmit={handleSaveRestaurant}>
                  <div className="business-field">
                    <label htmlFor="bp-businessName">Business name</label>
                    <input
                      id="bp-businessName"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                    />
                  </div>
                  <div className="business-field">
                    <AddressAutocomplete
                      sessionToken={sessionToken}
                      selectedPlaceId={placeId}
                      onSelect={(newPlaceId) => setPlaceId(newPlaceId)}
                    />
                  </div>
                  <div className="business-field">
                    <label htmlFor="bp-phone">Phone No.</label>
                    <input
                      id="bp-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="business-field">
                    <label htmlFor="bp-description">Description</label>
                    <textarea
                      id="bp-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <button className="business-button primary-dark">
                    Save Changes
                  </button>
                </form>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
