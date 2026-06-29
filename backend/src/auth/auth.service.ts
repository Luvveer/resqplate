import { auth } from "./better-auth/auth.js";
import { createProfile, findProfileByAuthId } from "./auth.repository.js";
import type { Profile } from "./auth.types.js";
import type { SignupInput, LoginInput } from "@resqplate/shared";

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
