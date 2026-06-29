import { useAuth } from "../../auth/useAuth";

export function SeekerDashboard() {
  const { profile, logout } = useAuth();
  return (
    <div>
      <p>Seeker Dashboard</p>;<p>Welcome, {profile?.name}</p>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}
