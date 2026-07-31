import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { ProfileResponse } from "@resqplate/shared";
import { authApi } from "../../api/authClient";
import { useAuth } from "../../auth/useAuth";
import "./Seeker.css";

export function SeekerProfilePage() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [name, setName] = useState("");
  const [preferences, setPreferences] = useState<string[]>([]);
  const [draftTag, setDraftTag] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const { logout } = useAuth();

  // check to see the current profile once
  useEffect(() => {
    let cancelled = false;

    authApi
      .profileMe()
      .then(({ profile }) => {
        if (cancelled) return;
        setProfile(profile);
        setName(profile.name);
        setPreferences(
          Array.isArray(profile.dietaryPreferences)
            ? profile.dietaryPreferences
            : [],
        );
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

  // Add the current draft tag to the list of preferences if it's not empty and not already present. Clear the draft tag afterward. Limit to 30 tags.
  function addTag() {
    const tag = draftTag.trim();
    if (!tag) return;
    const exists = preferences.some(
      (p) => p.toLowerCase() === tag.toLowerCase(),
    );
    if (!exists && preferences.length < 30) {
      setPreferences((prev) => [...prev, tag]);
    }
    setDraftTag("");
  }

  function removeTag(tag: string) {
    setPreferences((prev) => prev.filter((p) => p !== tag));
  }

  //Enter adds a chip instead of submitting anything.
  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  }

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
        dietaryPreferences: preferences,
      });
      setProfile(updated);
      setName(updated.name);
      setPreferences(
        Array.isArray(updated.dietaryPreferences)
          ? updated.dietaryPreferences
          : [],
      );
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
    <div className="sk-page">
      <header className="sk-topbar">
        <div className="sk-brand">
          <span className="sk-brand-mark" aria-hidden="true" />
          <span className="sk-brand-text">
            <b>ResQPlate</b>
          </span>
        </div>
        <div className="sk-topbar-spacer" />
        <nav className="sk-nav">
          <Link className="sk-nav-link" to="/seeker">
            Browse
          </Link>
          <Link className="sk-nav-link" to="/seeker/reservations">
            My Reservations
          </Link>
          <Link className="sk-nav-link is-active" to="/seeker/profile">
            Profile
          </Link>
          <button
            type="button"
            className="sk-nav-logout"
            onClick={() => logout()}
          >
            Logout
          </button>
        </nav>
      </header>

      <main className="sk-main">
        <div className="sk-head">
          <div>
            <h1 className="rq-display sk-title">My profile</h1>
            <p className="sk-sub">Update your name and dietary preferences.</p>
          </div>
        </div>

        {notice && <p className="rq-notice">{notice}</p>}
        {error && <p className="rq-error">{error}</p>}

        {isLoading ? (
          <p className="sk-message">Loading your profile...</p>
        ) : !profile ? (
          <section className="rq-card sk-empty">
            <h2 className="rq-display">Could not load profile</h2>
            <p className="rq-muted">Please try again later.</p>
          </section>
        ) : (
          <section className="sk-profile">
            <p className="sk-profile-signed rq-mono">
              Signed in as {profile.email}
            </p>

            <div className="sk-profile-field">
              <label htmlFor="pf-name">Name</label>
              <input
                id="pf-name"
                className="rq-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={255}
              />
            </div>

            <div className="sk-profile-field">
              <label htmlFor="pf-diet">Dietary preferences</label>
              <div className="sk-chip-input">
                <input
                  id="pf-diet"
                  className="rq-input"
                  placeholder="e.g. vegan, halal, no nuts"
                  value={draftTag}
                  onChange={(e) => setDraftTag(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  maxLength={60}
                />
                <button
                  type="button"
                  className="rq-btn rq-btn-ghost"
                  onClick={() => addTag()}
                >
                  Add
                </button>
              </div>

              {preferences.length > 0 ? (
                <ul className="sk-chip-list">
                  {preferences.map((tag) => (
                    <li key={tag} className="rq-chip on sk-chip">
                      {tag}
                      <button
                        type="button"
                        className="sk-chip-x"
                        aria-label={`Remove ${tag}`}
                        onClick={() => removeTag(tag)}
                      >
                        x
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rq-muted sk-chip-empty">
                  No dietary preferences added yet.
                </p>
              )}
            </div>

            <button
              className="rq-btn rq-btn-primary sk-profile-save"
              onClick={() => handleSave()}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>
            <button
              type="button"
              className="rq-btn rq-btn-danger sk-profile-delete"
              onClick={handleDeleteAccount}
            >
              Delete Account
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
