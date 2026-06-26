import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";

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
    <form onSubmit={handleSubmit}>
      <h1>Sign up</h1>
      <div>
        <label htmlFor="signup-name">Name</label>
        <input
          id="signup-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="signup-email">Email</label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="signup-password">Password</label>
        <input
          id="signup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="signup-role">I am a</label>
        <select
          id="signup-role"
          value={role}
          onChange={(e) =>
            setRole(e.target.value as "FOOD_SEEKER" | "BUSINESS")
          }
        >
          <option value="FOOD_SEEKER">Food Seeker</option>
          <option value="BUSINESS">Business</option>
        </select>
      </div>
      {error && <p>{error}</p>}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing up..." : "Sign up"}
      </button>
    </form>
  );
}
