import { useState, type SubmitEvent } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../../api/authClient";
import "./Auth.css";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [Submited, setSubmited] = useState(false);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await authApi.requestPasswordReset(email);
      setSubmited(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <main className="auth-page">
      <section className="auth-shell">
        <div className="auth-info">
          <div className="auth-logo">ResQplate</div>
          <h1>Forgot your password?</h1>
          <p>Enter your email account and we'll send you a reset link.</p>
        </div>
        <div className="auth-panel">
          <h2>Reset Password</h2>
          {Submited ? (
            <p>
              If that email exists in our system, a reset link has been sent.
              Checkk your inbox.
            </p>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-field">
                <label htmlFor="forgot-email">Email</label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {error && <p className="auth-error">{error}</p>}

              <button
                className="auth-submit"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send reset link"}
              </button>
            </form>
          )}

          <p className="auth-switch">
            Remembered your password? <Link to="/login">Login</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
