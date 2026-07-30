import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { RoleGuard } from "./auth/RoleGuard";
import { BusinessOnboardingGuard } from "./guards/BusinessOnboardingGuard";
import { DashboardRedirect } from "./pages/DashboardRedirect";
import { LoginPage } from "./pages/auth/LoginPage";
import { SignupPage } from "./pages/auth/SignupPage";
import { BusinessRoutes } from "./pages/business/BusinessRoutes";
import { SeekerRoutes } from "./pages/seeker/SeekerRouters";
import { AdminRoutes } from "./pages/admin/AdminRouters";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage";
import { ApiDocsPage } from "./pages/docs/ApiDocspage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/api-docs" element={<ApiDocsPage />} />
          <Route
            path="/business/*"
            element={
              <RoleGuard allowedRoles={["BUSINESS"]}>
                <BusinessOnboardingGuard>
                  <BusinessRoutes />
                </BusinessOnboardingGuard>
              </RoleGuard>
            }
          />

          <Route
            path="/seeker/*"
            element={
              <RoleGuard allowedRoles={["FOOD_SEEKER"]}>
                <SeekerRoutes />
              </RoleGuard>
            }
          />

          <Route
            path="/admin/*"
            element={
              <RoleGuard allowedRoles={["ADMIN"]}>
                <AdminRoutes />
              </RoleGuard>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
