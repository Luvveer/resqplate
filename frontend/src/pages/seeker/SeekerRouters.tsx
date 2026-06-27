import { Routes, Route } from "react-router-dom";
import { SeekerDashboard } from "./SeekerDashboard";

export function SeekerRoutes() {
  return (
    <Routes>
      <Route path="" element={<SeekerDashboard />} />
    </Routes>
  );
}
