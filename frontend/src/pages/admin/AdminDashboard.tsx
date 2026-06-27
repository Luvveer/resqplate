import { useAuth } from "../../auth/useAuth";

export function AdminDashboard() {
  const { profile, logout } = useAuth();
  return (
    <div>
      <h1>Seeker Dashboard</h1>
      <p>Welcome, {profile?.name}</p>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}
