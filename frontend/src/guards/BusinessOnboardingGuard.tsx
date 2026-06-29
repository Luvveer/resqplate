import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { RestaurantProfileResponse } from "@resqplate/shared";
import { companyApi } from "../api/restaurant";

export function BusinessOnboardingGuard({ children }: { children: ReactNode }) {
  const [restaurant, setRestaurant] =
    useState<RestaurantProfileResponse | null>(null);
  const [fetchedForPath, setFetchedForPath] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    let isCurrent = true;
    companyApi
      .getMyRestaurant()
      .then((result) => {
        if (isCurrent) setRestaurant(result.restaurant);
        setFetchedForPath(location.pathname);
      })
      .catch(() => {
        if (isCurrent) setRestaurant(null);
        setFetchedForPath(location.pathname);
      });
    return () => {
      isCurrent = false;
    };
  }, [location.pathname]);

  const isLoading = fetchedForPath != location.pathname;
  if (isLoading) return null;
  const isOneSteupPage = location.pathname === "/business/setup";
  if (!restaurant && !isOneSteupPage)
    return <Navigate to="/business/setup" replace />;
  if (restaurant && isOneSteupPage) return <Navigate to="/business" replace />;
  return <>{children}</>;
}
