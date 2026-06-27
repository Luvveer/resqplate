import { Routes, Route } from "react-router-dom";
import { AdminDashboard } from "./AdminDashboard";

export function AdminRoutes() {
  return (
    <Routes>
      <Route path="" element={<AdminDashboard />} />
    </Routes>
  );
}
