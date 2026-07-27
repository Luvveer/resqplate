import { useState, type SubmitEvent } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../../api/authClient";
import "./Auth.css";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await authApi.requestPasswordReset(email);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
            <h1 className="rq-display">Forgot your password?</h1>
            <p>Enter your email and we'll send you a link to reset it.</p>
          </div>

          <p className="auth-info-foot rq-mono">
            Surplus food · fair prices · zero waste
          </p>
        </aside>

        <div className="auth-panel">
          <h2 className="rq-display">Reset password</h2>
          <p className="auth-subtitle">We'll email you a secure reset link.</p>

          {submitted ? (
            <p className="rq-notice">
              If that email exists in our system, a reset link has been sent.
              Check your inbox.
            </p>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-field">
                <label htmlFor="forgot-email">Email</label>
                <input
                  id="forgot-email"
                  className="rq-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {error && <p className="rq-error">{error}</p>}

              <button
                className="rq-btn rq-btn-primary auth-submit"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send reset link"}
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
