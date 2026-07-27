import { useState, type SubmitEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../../api/authClient";
import "./Auth.css";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("The reset link is invalid or has expired.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsSubmitting(true);

    try {
      await authApi.confirmPasswordReset(newPassword, token);
      navigate("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <aside className="auth-info">
          <div className="auth-brand">
            <span className="auth-brand-mark" aria-hidden="true" />
            <span className="auth-brand-text">
              <b>ResQPlate</b>
              <span>Expo Line</span>
            </span>
          </div>

          <div className="auth-info-body">
            <h1 className="rq-display">Set a new password.</h1>
            <p>Choose a new password for your account.</p>
          </div>

          <p className="auth-info-foot rq-mono">
            Surplus food · fair prices · zero waste
          </p>
        </aside>

        <div className="auth-panel">
          <h2 className="rq-display">Reset password</h2>

          {!token ? (
            <p className="rq-error">
              This reset link is invalid or has expired.{" "}
              <Link to="/forgot-password">Request a new one</Link>
            </p>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-field">
                <label htmlFor="reset-new-password">New password</label>
                <input
                  id="reset-new-password"
                  className="rq-input"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              <div className="auth-field">
                <label htmlFor="reset-confirm-password">Confirm password</label>
                <input
                  id="reset-confirm-password"
                  className="rq-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              {error && <p className="rq-error">{error}</p>}

              <button
                className="rq-btn rq-btn-primary auth-submit"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Resetting..." : "Reset password"}
              </button>
            </form>
          )}

          <p className="auth-switch">
            Remembered your password? <Link to="/login">Log in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
