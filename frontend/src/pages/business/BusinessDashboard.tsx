import { useAuth } from "../../auth/useAuth";
import { useState, useEffect } from "react";
import { companyApi } from "../../api/restaurant";
import type { RestaurantProfileResponse } from "@resqplate/shared";

export function BusinessDashboard() {
  const { profile, logout } = useAuth();
  const [restaurant, setRestaurant] =
    useState<RestaurantProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    companyApi
      .getMyRestaurant()
      .then((result) => setRestaurant(result.restaurant))
      .catch(() => setRestaurant(null))
      .finally(() => setIsLoading(false));
  }, []);
  if (isLoading) return null;

  if (restaurant?.verificationStatus !== "APPROVED") {
    return (
      <div>
        <h1>Business Dashboard</h1>
        <p>Welcome, {profile?.name}</p>
        <p>
          Your restraunt profile is still being reviewed. Our admins will get
          back to you as soon as possible.
        </p>
        <button onClick={() => logout()}>Logout</button>
      </div>
    );
  }
  return (
    <div>
      <h1>Business Dashboard</h1>
      <p>Welcome, {profile?.name}</p>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}
