import { useState, type SubmitEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import "./Auth.css";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "login failed");
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <main className="auth-page">
      <section className="auth-shell">
        {/* Left: brand story panel */}
        <aside className="auth-info">
          <div className="auth-brand">
            <span className="auth-brand-mark" aria-hidden="true" />
            <span className="auth-brand-text">
              <b>ResQPlate</b>
            </span>
          </div>

          <div className="auth-info-body">
            <h1 className="rq-display">Rescue tonight's surplus food.</h1>
            <p>
              Reserve a food item from kitchens near you, pick it up before the
              window closes. Good food, saved from waste.
            </p>
          </div>

          <p className="auth-info-foot rq-mono">
            Surplus food | fair prices | zero waste
          </p>
        </aside>

        <div className="auth-panel">
          <h2 className="rq-display">Welcome back</h2>
          <p className="auth-subtitle">Sign in to your account to continue.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                className="rq-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                className="rq-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="rq-error">{error}</p>}

            <button
              className="rq-btn rq-btn-primary auth-submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="auth-switch">
            <Link to="/forgot-password">Forgot password?</Link>
          </p>
          <p className="auth-switch">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
