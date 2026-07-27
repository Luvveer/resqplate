import { useState, type SubmitEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import "./Auth.css";

export function SignupPage() {
  const { signup, logout } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"FOOD_SEEKER" | "BUSINESS">("FOOD_SEEKER");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await signup(email, password, name, role);
      await logout();
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
        <aside className="auth-info">
          <div className="auth-brand">
            <span className="auth-brand-mark" aria-hidden="true" />
            <span className="auth-brand-text">
              <b>ResQPlate</b>
              <span>Expo Line</span>
            </span>
          </div>

          <div className="auth-info-body">
            <h1 className="rq-display">Create your account.</h1>
            <p>
              Join as a food seeker to reserve surplus meals near you, or
              register your business to share what would otherwise go to waste.
            </p>
          </div>

          <p className="auth-info-foot rq-mono">
            Surplus food · fair prices · zero waste
          </p>
        </aside>

        <div className="auth-panel">
          <h2 className="rq-display">Sign up</h2>
          <p className="auth-subtitle">
            Choose your account type and create your account.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="signup-name">Name</label>
              <input
                id="signup-name"
                className="rq-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="signup-email">Email</label>
              <input
                id="signup-email"
                className="rq-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                className="rq-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="signup-role">I am a</label>
              <select
                id="signup-role"
                className="rq-input"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as "FOOD_SEEKER" | "BUSINESS")
                }
              >
                <option value="FOOD_SEEKER">Food Seeker</option>
                <option value="BUSINESS">Business</option>
              </select>
            </div>

            {error && <p className="rq-error">{error}</p>}

            <button
              className="rq-btn rq-btn-primary auth-submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing up..." : "Sign up"}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
