import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth";

interface RoleGuardProps {
  allowedRoles: Array<"FOOD_SEEKER" | "BUSINESS" | "ADMIN">;
  children: ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { profile, isLoading } = useAuth();
  if (isLoading) return null;
  if (!profile) return <Navigate to="/" />;
  if (!allowedRoles.includes(profile.role)) return <Navigate to="/" />;
  return <>{children}</>;
}
