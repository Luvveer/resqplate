import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { auth } from "../auth/better-auth/auth.js";
import { db } from "../db/index.js";
import { ProfileTable } from "../db/schema.js";

type Session = typeof auth.$Infer.Session;
type Profile = typeof ProfileTable.$inferSelect;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      session?: Session["session"];
      user?: Session["user"];
      profile?: Profile;
    }
  }
}

export function toHeaders(reqHeaders: Request["headers"]): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(reqHeaders)) {
    if (value)
      headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }
  return headers;
}

export async function getSession(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.log("Cookie header:", req.headers.cookie ?? "NO COOKIE");
  const result = await auth.api.getSession({ headers: toHeaders(req.headers) });
  console.log("session result", result ? `user: ${result.user.email}` : null);
  if (!result) {
    return next();
  }

  req.session = result.session;
  req.user = result.user;

  const [profile] = await db
    .select()
    .from(ProfileTable)
    .where(eq(ProfileTable.authId, result.user.id));
  if (profile) {
    req.profile = profile;
  }

  next();
}

function requireRole(role: "FOOD_SEEKER" | "BUSINESS" | "ADMIN") {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.profile) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (req.profile.role !== role) {
      return res.status(403).json({
        error: `${req.profile.role} is not permitted. Requires ${role} role.`,
      });
    }
    next();
  };
}

export const isFoodSeeker = requireRole("FOOD_SEEKER");
export const isBusiness = requireRole("BUSINESS");
export const isAdmin = requireRole("ADMIN");
