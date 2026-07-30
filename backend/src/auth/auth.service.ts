import { auth } from "./better-auth/auth.js";
import {
  createProfile,
  deleteUserAccount,
  findProfileByAuthId,
  updateProfileById,
} from "./auth.repository.js";
import type { Profile, UpdateSeekerProfile } from "./auth.types.js";
import type {
  SignupInput,
  LoginInput,
  requestPasswordResetInput,
  confirmPasswordResetInput,
} from "@resqplate/shared";

export async function signup(
  input: SignupInput,
): Promise<{ headers: Headers; profile: Profile }> {
  const { headers, response } = await auth.api.signUpEmail({
    body: { email: input.email, password: input.password, name: input.name },
    returnHeaders: true,
  });

  const profile = await createProfile({
    authId: response.user.id,
    email: response.user.email,
    name: response.user.name,
    role: input.role,
  });

  return { headers, profile };
}
export async function login(
  input: LoginInput,
): Promise<{ headers: Headers; profile: Profile }> {
  const { headers, response } = await auth.api.signInEmail({
    body: { email: input.email, password: input.password },
    returnHeaders: true,
  });

  const profile = await findProfileByAuthId(response.user.id);

  if (!profile) {
    throw new Error("No profile found for this account");
  }

  return { headers, profile };
}

export async function logout(headers: Headers): Promise<Headers> {
  const { headers: responseHeaders } = await auth.api.signOut({
    headers,
    returnHeaders: true,
  });
  return responseHeaders;
}

export async function requestPasswordReset(input: requestPasswordResetInput) {
  await auth.api.requestPasswordReset({
    body: { email: input.email, redirectTo: input.redirectTo },
  });
}

export async function confirmPasswordReset(input: confirmPasswordResetInput) {
  await auth.api.resetPassword({
    body: { newPassword: input.newPassword, token: input.token },
  });
}

export async function deleteAccount(
  authId: string,
  headers: Headers,
): Promise<Headers> {
  const { headers: responseHeaders } = await auth.api.signOut({
    headers,
    returnHeaders: true,
  });
  await deleteUserAccount(authId);
  return responseHeaders;
}

export async function updateSeekerProfile(
  profileId: string,
  input: UpdateSeekerProfile,
): Promise<Profile> {
  const profile = await updateProfileById(profileId, input);
  // Make sure that the seeker is authiticated and the profile exists before updating it
  if (!profile) {
    throw new Error("Sorry !! There was no profile  found");
  }
  return profile;
}
