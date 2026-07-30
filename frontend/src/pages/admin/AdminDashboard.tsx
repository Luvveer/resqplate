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
          <span className="admin-brand-mark" aria-hidden="true" />
          <div>
            <h1 className="admin-brand-title">ResQPlate Admin</h1>
            <p className="admin-brand-subtitle">Verification platform</p>
          </div>
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
            <h2 className="admin-title">Restaurant verification</h2>
            <p className="admin-sub">
              Review business profiles and approve, reject, or follow up.
            </p>
          </div>

          <button
            className="rq-btn rq-btn-ghost"
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

        <section className="admin-panel-block">
          <div className="admin-panel-top">
            <h3 className="admin-panel-title">Business profiles</h3>
            <div className="admin-filters">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  className={`admin-filter ${
                    statusFilter === status ? "on" : ""
                  }`}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                >
                  {formatStatus(status)}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="rq-error admin-inset">{error}</p>}

          {isLoading ? (
            <p className="admin-message">Loading restaurant profiles...</p>
          ) : restaurants.length === 0 ? (
            <p className="admin-message">No restaurant profiles found.</p>
          ) : (
            <div className="admin-card-list">
              {restaurants.map((restaurant) => (
                <article key={restaurant.id} className="admin-card">
                  <div className="admin-card-head">
                    <div>
                      <h4 className="admin-card-name">
                        {restaurant.businessName}
                      </h4>
                      <p className="admin-card-desc">
                        {restaurant.description || "No description provided."}
                      </p>
                    </div>
                    <span
                      className={`admin-status ${getStatusClass(
                        restaurant.verificationStatus,
                      )}`}
                    >
                      {formatStatus(restaurant.verificationStatus)}
                    </span>
                  </div>

                  <dl className="admin-card-meta">
                    <div>
                      <dt>Location</dt>
                      <dd>
                        {restaurant.address}
                        <span className="admin-muted">
                          {restaurant.city}, {restaurant.province}{" "}
                          {restaurant.postalCode}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt>Contact</dt>
                      <dd>{restaurant.phone || "No phone"}</dd>
                    </div>
                  </dl>

                  <textarea
                    className="admin-notes"
                    value={
                      adminNotes[restaurant.id] ?? restaurant.adminNotes ?? ""
                    }
                    onChange={(event) =>
                      setAdminNotes((current) => ({
                        ...current,
                        [restaurant.id]: event.target.value,
                      }))
                    }
                    rows={2}
                    placeholder="Add admin notes (optional)"
                  />

                  <div className="admin-card-actions">
                    <button
                      className="rq-btn rq-btn-primary"
                      onClick={() => runAction(restaurant.id, "approve")}
                      disabled={updatingId === restaurant.id}
                    >
                      Approve
                    </button>
                    <button
                      className="rq-btn rq-btn-ghost admin-btn-danger"
                      onClick={() => runAction(restaurant.id, "reject")}
                      disabled={updatingId === restaurant.id}
                    >
                      Reject
                    </button>
                    <button
                      className="rq-btn rq-btn-ghost"
                      onClick={() => runAction(restaurant.id, "request-info")}
                      disabled={updatingId === restaurant.id}
                    >
                      Request info
                    </button>
                    <button
                      className="rq-btn rq-btn-ghost"
                      onClick={() => runAction(restaurant.id, "suspend")}
                      disabled={updatingId === restaurant.id}
                    >
                      Suspend
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
