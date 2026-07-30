import { Routes, Route } from "react-router-dom";
import { RestaurantInfoPage } from "./RestaurantInfoPage";
import { BusinessDashboard } from "./BusinessDashboard";
import { BusinessListingsPage } from "./BusinessListingsPage";
import { CreateListingPage } from "./CreateListingPage";
import { EditListingPage } from "./EditListingPage";
import { PickupManagementPage } from "./PickupManagementPage";
import { BusinessProfilePage } from "./BusinessProfilePage";

export function BusinessRoutes() {
  return (
    <Routes>
      <Route path="setup" element={<RestaurantInfoPage />} />
      <Route path="" element={<BusinessDashboard />} />
      <Route path="listings" element={<BusinessListingsPage />} />
      <Route path="listings/new" element={<CreateListingPage />} />
      <Route path="listings/:listingId/edit" element={<EditListingPage />} />
      <Route path="pickups" element={<PickupManagementPage />} />
      <Route path="profile" element={<BusinessProfilePage />} />
    </Routes>
  );
}
