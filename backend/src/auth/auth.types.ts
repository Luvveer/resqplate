import type { UserRole, profileStatus } from "@resqplate/shared";

export type Profile = {
  id: string;
  authId: string;
  email: string;
  name: string;
  role: UserRole;
  status: profileStatus;
  dietaryPreferences: unknown;
  createdAt: Date;
  updatedAt: Date;
};

export type NewProfile = {
  authId: string;
  email: string;
  name: string;
  role: UserRole;
  status?: profileStatus;
  dietaryPreferences?: unknown;
};

//allow partial updates to the seeker profile as well
export type UpdateSeekerProfile = {
  name?: string;
  dietaryPreferences?: string[];
};
