import type { Request, Response } from "express";
import { createReservationSchema } from "@resqplate/shared";
import { createReservation } from "./reservations.service.js";
import type {} from "../middleware/auth.middleware.js";

//the post api reservations

// Reserve the listing for a authinticated and loggin user, and return the reservation details
export async function createReservationHandler(req: Request, res: Response) {
  //   const profileId = req.user?.id;
  if (!req.profile) {
    return res.status(401).json({ error: "User is not authorized" });
  }

  const body = createReservationSchema.parse(req.body);

  try {
    const reservation = await createReservation(req.profile.id, body);

    //check to see if there exist a listing for the reservation
    if (!reservation) {
      return res
        .status(404)
        .json({ error: "The requested food listing was not found" });
    }

    return res.status(201).json({ reservation });
  } catch (error) {
    // we must throw the error when ever there is any problem, if the listing is sold out, the window is passed, or the listing is already reserved
    if (error instanceof Error) {
      return res.status(409).json({ error: error.message });
    }
    throw error;
  }
}
