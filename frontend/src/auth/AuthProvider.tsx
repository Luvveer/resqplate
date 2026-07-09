import { useEffect, useState, type ReactNode } from "react";
import type { ProfileResponse } from "@resqplate/shared";
import { authApi } from "../api/authClient";
import { AuthContext } from "./useAuth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      console.log("checkSession: starting, about to call /me...");
      try {
        const result = await authApi.profileMe();
        console.log("checkSession: got a response", result);
        setProfile(result.profile);
      } catch {
        console.log("checkSession: caught an error");
        setProfile(null);
      } finally {
        console.log("checkSession: finally ran, setting isLoading to false");
        setIsLoading(false);
      }
    }
    checkSession();
  }, []);
  async function login(email: string, password: string) {
    const result = await authApi.loginRequest(email, password);
    setProfile(result.profile);
  }

  async function signup(
    email: string,
    password: string,
    name: string,
    role: "FOOD_SEEKER" | "BUSINESS" | "ADMIN",
  ) {
    const result = await authApi.signupRequest(email, password, name, role);
    setProfile(result.profile);
  }

  async function logout() {
    await authApi.logoutRequest();
    setProfile(null);
  }
  return (
    <AuthContext.Provider value={{ profile, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
