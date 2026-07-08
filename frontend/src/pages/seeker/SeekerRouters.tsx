import { Routes, Route } from "react-router-dom";
// import { SeekerDashboard } from "./SeekerDashboard";
import { BrowseListingsPage } from "./BrowseListingsPage";
import { MyReservationsPage } from "./MyReservationsPage";

export function SeekerRoutes() {
  return (
    <Routes>
      {/* <Route path="" element={<SeekerDashboard />} /> */}

      {/* this is the seeker's landing page for the feed */}
      <Route path="" element={<BrowseListingsPage />} />

      {/* this is for the seeker's own reservations */}
      <Route path="reservations" element={<MyReservationsPage />} />
    </Routes>
  );
}
