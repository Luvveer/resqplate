import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { ProfileResponse } from "@resqplate/shared";
import { authApi } from "../../api/authClient";
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
      setNotice("Profile updated.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update your profile.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="seeker-page">
      <header className="seeker-topbar">
        <div className="seeker-brand">
          <h1>My Profile</h1>
          <p>Update your name and dietary preferences.</p>
        </div>
        <div className="seeker-actions">
          <Link className="seeker-link-button secondary" to="/seeker">
            Back to listings
          </Link>
        </div>
      </header>

      <main className="seeker-main">
        {notice && <p className="seeker-notice">{notice}</p>}
        {error && <p className="seeker-error">{error}</p>}

        {isLoading ? (
          <p className="seeker-message">Loading your profile...</p>
        ) : !profile ? (
          <section className="seeker-card">
            <h2>Could not load profile</h2>
            <p className="seeker-muted">Please try again later.</p>
          </section>
        ) : (
          <section className="seeker-card seeker-profile-card">
            {/* Email is identity, not editable here. */}
            <p className="seeker-muted">Signed in as {profile.email}</p>

            <label className="seeker-slot-label">
              Name
              <input
                className="seeker-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={255}
              />
            </label>

            <label className="seeker-slot-label">
              Dietary preferences
              <div className="seeker-chip-input">
                <input
                  className="seeker-input"
                  placeholder="e.g. vegan, halal, no nuts"
                  value={draftTag}
                  onChange={(e) => setDraftTag(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  maxLength={60}
                />
                <button
                  type="button"
                  className="seeker-button"
                  onClick={() => addTag()}
                >
                  Add
                </button>
              </div>
            </label>

            {preferences.length > 0 ? (
              <ul className="seeker-chip-list">
                {preferences.map((tag) => (
                  <li key={tag} className="seeker-chip">
                    {tag}
                    <button
                      type="button"
                      className="seeker-chip-remove"
                      aria-label={`Remove ${tag}`}
                      onClick={() => removeTag(tag)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="seeker-muted">No dietary preferences added yet.</p>
            )}

            <button
              className="seeker-button"
              onClick={() => handleSave()}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
