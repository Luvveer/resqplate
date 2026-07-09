import { useAuth } from "../../auth/useAuth";
import { useEffect, useState } from "react";
import { adminApi } from "../../api/admin";
import type {
  AdminRestaurantProfileResponse,
  verificationStatus,
} from "@resqplate/shared";
import "./Admin.css";

const statusOptions: Array<verificationStatus | "ALL"> = [
  "ALL",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "INFO_REQUESTED",
  "SUSPENDED",
];

function formatStatus(status: verificationStatus | "ALL") {
  return status
    .toLocaleLowerCase()
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function getStatusClass(status: verificationStatus) {
  return status.toLowerCase().replace("_", "-");
}

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

  const pendingCount = restaurants.filter(
    (restaurant) => restaurant.verificationStatus === "PENDING",
  ).length;

  const approvedCount = restaurants.filter(
    (restaurant) => restaurant.verificationStatus === "APPROVED",
  ).length;

  return (
    <div className="admin-page">
      <header className="admin-topbar">
        <div className="admin-brand">
          <h1 className="admin-brand-title">ResQPlate Admin Platform</h1>
          <p className="admin-brand-subtitle">Restaurant verification panel</p>
        </div>

        <div className="admin-user">
          <span className="admin-user-name">Welcome, {profile?.name}</span>
          <button className="admin-logout" onClick={() => logout()}>
            Logout
          </button>
        </div>
      </header>

      <main className="admin-main">
        <section className="admin-header">
          <div>
            <h2>Restaurant Verification</h2>
            <p>Review business profiles and Approve business.</p>
          </div>

          <button
            className="admin-refresh"
            onClick={() => loadRestaurants()}
            disabled={isLoading}
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </section>

        <section className="admin-stats">
          <div className="admin-stat-card">
            <p className="admin-stat-label">Showing</p>
            <p className="admin-stat-value">{restaurants.length}</p>
          </div>

          <div className="admin-stat-card">
            <p className="admin-stat-label">Pending in view</p>
            <p className="admin-stat-value">{pendingCount}</p>
          </div>

          <div className="admin-stat-card">
            <p className="admin-stat-label">Approved in view</p>
            <p className="admin-stat-value">{approvedCount}</p>
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-header">
            <h3>Business profiles</h3>

            <div className="admin-filters">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  className={`admin-filter-button ${
                    statusFilter === status ? "active" : ""
                  }`}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                >
                  {formatStatus(status)}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="admin-error">{error}</p>}

          {isLoading ? (
            <p className="admin-message">Loading restaurant profiles...</p>
          ) : restaurants.length === 0 ? (
            <p className="admin-message">No restaurant profiles found.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Business</th>
                    <th>Location</th>
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
                        <div className="admin-business-name">
                          {restaurant.businessName}
                        </div>
                        <div className="admin-business-description">
                          {restaurant.description || "No description provided."}
                        </div>
                      </td>

                      <td>
                        <div>{restaurant.address}</div>
                        <div className="admin-muted">
                          {restaurant.city}, {restaurant.province}{" "}
                          {restaurant.postalCode}
                        </div>
                      </td>

                      <td>
                        <div>{restaurant.phone || "No phone"}</div>
                      </td>

                      <td>
                        <span
                          className={`admin-status ${getStatusClass(
                            restaurant.verificationStatus,
                          )}`}
                        >
                          {formatStatus(restaurant.verificationStatus)}
                        </span>
                      </td>

                      <td>
                        <textarea
                          className="admin-notes"
                          value={
                            adminNotes[restaurant.id] ??
                            restaurant.adminNotes ??
                            ""
                          }
                          onChange={(event) =>
                            setAdminNotes((current) => ({
                              ...current,
                              [restaurant.id]: event.target.value,
                            }))
                          }
                          rows={3}
                          placeholder="Add admin notes"
                        />
                      </td>

                      <td>
                        <div className="admin-actions">
                          <button
                            className="admin-action approve"
                            onClick={() => runAction(restaurant.id, "approve")}
                            disabled={updatingId === restaurant.id}
                          >
                            Approve
                          </button>

                          <button
                            className="admin-action reject"
                            onClick={() => runAction(restaurant.id, "reject")}
                            disabled={updatingId === restaurant.id}
                          >
                            Reject
                          </button>

                          <button
                            className="admin-action"
                            onClick={() =>
                              runAction(restaurant.id, "request-info")
                            }
                            disabled={updatingId === restaurant.id}
                          >
                            Info
                          </button>

                          <button
                            className="admin-action"
                            onClick={() => runAction(restaurant.id, "suspend")}
                            disabled={updatingId === restaurant.id}
                          >
                            Suspend
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
