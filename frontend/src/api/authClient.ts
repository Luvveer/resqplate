import { apiClient } from "./apiClient";
import type {
  SignupInput,
  LoginInput,
  UserRole,
  ProfileResponse,
  UpdateSeekerProfileInput,
} from "@resqplate/shared";

class AuthAPI {
  async loginRequest(input_email: string, input_password: string) {
    const loginData: LoginInput = {
      email: input_email,
      password: input_password,
    };
    return await apiClient.request<{ profile: ProfileResponse }>(
      "POST",
      "/auth/login",
      loginData,
    );
  }

  async signupRequest(
    input_email: string,
    input_password: string,
    input_name: string,
    input_role: UserRole,
  ) {
    const signupData: SignupInput = {
      email: input_email,
      password: input_password,
      name: input_name,
      role: input_role,
    };
    return await apiClient.request<{ profile: ProfileResponse }>(
      "POST",
      "/auth/signup",
      signupData,
    );
  }

  async logoutRequest() {
    return await apiClient.request<{ message: string }>("POST", "/auth/logout");
  }

  async profileMe() {
    return await apiClient.request<{ profile: ProfileResponse }>(
      "GET",
      "/auth/profile/me",
    );
  }

  async updateProfile(input: UpdateSeekerProfileInput) {
    return await apiClient.request<{ profile: ProfileResponse }>(
      "PATCH",
      "/auth/profile/me",
      input,
    );
  }

  async requestPasswordReset(email: string) {
    return await apiClient.request<{ message: string }>(
      "POST",
      "/auth/password-reset/request",
      {
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      },
    );
  }

  async confirmPasswordReset(newPassword: string, token: string) {
    return await apiClient.request<{ message: string }>(
      "POST",
      "/auth/password-reset/confirm",
      {
        newPassword,
        token,
      },
    );
  }
}

export const authApi = new AuthAPI();
