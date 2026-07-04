import { useAuth } from "../../auth/useAuth";
import { useEffect, useState } from "react";
import { adminApi } from "../../api/admin";
import type {
  AdminRestaurantProfileResponse,
  verificationStatus,
} from "@resqplate/shared";

const statusOptions: Array<verificationStatus | "ALL"> = [
  "ALL",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "INFO_REQUESTED",
  "SUSPENDED",
];

export function AdminDashboard() {
  const { profile, logout } = useAuth();
  const [restaurants, setRestaurants] = useState<
    AdminRestaurantProfileResponse[]
  >([]);
  const [statusFilter, setStatusFilter] = useState<verificationStatus | "ALL">(
    "PENDING",
  );
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadRestaurants(status = statusFilter) {
    setError(null);
    setIsLoading(true);
    try {
      const result = await adminApi.getRestaurants(
        status === "ALL" ? undefined : status,
      );
      setRestaurants(result.restaurants);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profiles");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function fetchRestaurants() {
      try {
        setIsLoading(true);
        const response = await adminApi.getRestaurants(
          statusFilter === "ALL" ? undefined : statusFilter,
        );
        setRestaurants(response.restaurants);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load restaurants",
        );
      } finally {
        setIsLoading(false);
      }
    }
    fetchRestaurants();
  }, [statusFilter]);

  async function runAction(
    restaurantId: string,
    action: "approve" | "reject" | "request-info" | "suspend",
  ) {
    setError(null);
    setUpdatingId(restaurantId);

    const input = {
      adminNotes: adminNotes[restaurantId] || undefined,
    };

    try {
      if (action === "approve") {
        await adminApi.approveRestaurant(restaurantId, input);
      } else if (action === "reject") {
        await adminApi.rejectRestaurant(restaurantId, input);
      } else if (action === "request-info") {
        await adminApi.requestRestaurantInfo(restaurantId, input);
      } else {
        await adminApi.suspendRestaurant(restaurantId, input);
      }

      await loadRestaurants();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Welcome, {profile?.name}</p>
      <button onClick={() => logout()}>Logout</button>

      <section>
        <h2>Restaurant Verification</h2>

        <label htmlFor="status-filter">Status</label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as verificationStatus | "ALL")
          }
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <button onClick={() => loadRestaurants()} disabled={isLoading}>
          Refresh
        </button>

        {error && <p>{error}</p>}

        {isLoading ? (
          <p>Loading...</p>
        ) : restaurants.length === 0 ? (
          <p>No restaurant profiles found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Business</th>
                <th>Address</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Admin notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((restaurant) => (
                <tr key={restaurant.id}>
                  <td>
                    <strong>{restaurant.businessName}</strong>
                    <div>{restaurant.description}</div>
                  </td>
                  <td>
                    <div>{restaurant.address}</div>
                    <div>
                      {restaurant.city}, {restaurant.province}{" "}
                      {restaurant.postalCode}
                    </div>
                  </td>
                  <td>{restaurant.phone || "No phone"}</td>
                  <td>{restaurant.verificationStatus}</td>
                  <td>
                    <textarea
                      value={
                        adminNotes[restaurant.id] ?? restaurant.adminNotes ?? ""
                      }
                      onChange={(event) =>
                        setAdminNotes((current) => ({
                          ...current,
                          [restaurant.id]: event.target.value,
                        }))
                      }
                      rows={3}
                    />
                  </td>
                  <td>
                    <button
                      onClick={() => runAction(restaurant.id, "approve")}
                      disabled={updatingId === restaurant.id}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => runAction(restaurant.id, "reject")}
                      disabled={updatingId === restaurant.id}
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => runAction(restaurant.id, "request-info")}
                      disabled={updatingId === restaurant.id}
                    >
                      Request Info
                    </button>
                    <button
                      onClick={() => runAction(restaurant.id, "suspend")}
                      disabled={updatingId === restaurant.id}
                    >
                      Suspend
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
