import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export function DashboardRedirect() {
  const { profile, isLoading } = useAuth();

  if (isLoading) return null;
  if (!profile) return <Navigate to="login" replace />;

  if (profile.role === "FOOD_SEEKER") return <Navigate to="/seeker" replace />;
  if (profile.role === "BUSINESS") return <Navigate to="/business" replace />;
  return <Navigate to="/admin" replace />;
}
