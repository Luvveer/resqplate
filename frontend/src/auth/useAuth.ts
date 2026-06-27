import { useContext, createContext } from "react";
import type { ProfileResponse } from "@resqplate/shared";

export interface AuthContextValue {
  profile: ProfileResponse | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    name: string,
    role: "FOOD_SEEKER" | "BUSINESS" | "ADMIN",
  ) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
