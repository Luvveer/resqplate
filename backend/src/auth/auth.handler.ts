import type { Request, Response } from "express";
import {
  signupSchema,
  loginSchema,
  requestPasswordResetSchema,
  confirmPasswordResetSchema,
  updateSeekerProfileSchema,
} from "@resqplate/shared";
import { APIError } from "better-auth";
import {
  signup,
  login,
  logout,
  requestPasswordReset,
  confirmPasswordReset,
  updateSeekerProfile,
} from "./auth.service.js";
import { toHeaders } from "../middleware/auth.middleware.js";
import auth from "./better-auth/auth.js";
import { findProfileByAuthId } from "./auth.repository.js";

function forwardCookies(res: Response, headers: Headers) {
  for (const cookie of headers.getSetCookie()) {
    res.appendHeader("Set-Cookie", cookie);
  }
}
export async function signupHandler(req: Request, res: Response) {
  const body = signupSchema.parse(req.body);
  try {
    const { headers, profile } = await signup(body);
    forwardCookies(res, headers);
    return res.status(201).json({ profile });
  } catch (error) {
    if (error instanceof APIError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    throw error;
  }
}

export async function loginHandler(req: Request, res: Response) {
  const body = loginSchema.parse(req.body);
  try {
    const { headers, profile } = await login(body);
    forwardCookies(res, headers);
    return res.status(200).json({ profile });
  } catch (error) {
    if (error instanceof APIError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    throw error;
  }
}

export async function logoutHandler(req: Request, res: Response) {
  const headers = await logout(toHeaders(req.headers));
  forwardCookies(res, headers);
  return res.status(200).json({ message: "Logged out" });
}

export async function profileHandler(req: Request, res: Response) {
  try {
    const session = await auth.api.getSession({
      headers: toHeaders(req.headers),
    });

    if (!session) {
      return res.status(401).json({
        error: "Not authenticated",
      });
    }

    const profile = await findProfileByAuthId(session.user.id);

    if (!profile) {
      return res.status(404).json({
        profile,
      });
    }

    return res.status(200).json({ profile });
  } catch {
    return res.status(500).json({
      error: "Failed to get current user",
    });
  }
}

export async function updateProfileHandler(req: Request, res: Response) {
  // If the request is from a seeker
  if (!req.profile) {
    return res
      .status(401)
      .json({ error: "Sorry!! you are not authorized to update this profile" });
  }
  const body = updateSeekerProfileSchema.parse(req.body);
  try {
    // Making sure that the seeker can only edi their own profile
    const profile = await updateSeekerProfile(req.profile.id, body);
    return res.status(200).json({ profile });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Sorry !! There was no profile  found"
    ) {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: "Sorry!! Failed to update profile" });
  }
}

export async function passwordResetHandler(req: Request, res: Response) {
  const body = requestPasswordResetSchema.parse(req.body);
  try {
    await requestPasswordReset(body);
    return res
      .status(200)
      .json({ message: "If this email exists , a reset link was sent" });
  } catch (error) {
    if (error instanceof APIError) {
      return res.status(error.statusCode).json({
        error: error.message,
      });
    }
    throw error;
  }
}
export async function passwordResetConfirmHandler(req: Request, res: Response) {
  const body = confirmPasswordResetSchema.parse(req.body);
  try {
    await confirmPasswordReset(body);
    return res.status(200).json({ message: "Password Updated" });
  } catch (error) {
    if (error instanceof APIError) {
      return res.status(error.statusCode).json({
        error: error.message,
      });
    }
    throw error;
  }
}
