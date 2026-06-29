import { Routes, Route } from "react-router-dom";
import { RestaurantInfoPage } from "./RestaurantInfoPage";
import { BusinessDashboard } from "./BusinessDashboard";

export function BusinessRoutes() {
  return (
    <Routes>
      <Route path="setup" element={<RestaurantInfoPage />} />
      <Route path="" element={<BusinessDashboard />} />
    </Routes>
  );
}
