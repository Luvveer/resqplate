import type { Request, Response } from "express";
import {
  createReservationSchema,
  reservationParamsSchema,
} from "@resqplate/shared";
import {
  createReservation,
  getMyReservations,
  cancelReservation,
} from "./reservations.service.js";
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

// the post API for reservations to get all the reservations for a given seeker

// Function for the seeker to get all their reservations, along with the associated listing details
export async function getMyReservationsHandler(req: Request, res: Response) {
  if (!req.profile) {
    return res.status(401).json({ error: "Sorry !! You are not authorized" });
  }
  const reservations = await getMyReservations(req.profile.id);
  return res.status(200).json({ reservations });
}

// Meant to cancel the seeker's reservation for a given listing, and return the updated reservation details
export async function cancelReservationHandler(req: Request, res: Response) {
  if (!req.profile) {
    return res.status(401).json({ error: "Sorry!! You are not authorized" });
  }

  const params = reservationParamsSchema.parse(req.params);

  try {
    const reservation = await cancelReservation(
      req.profile.id,
      params.reservationId,
    );

    // instance when the reservation is not found or the reservation does not belong to the seeker
    if (!reservation) {
      return res
        .status(404)
        .json({ error: "Reservation not found or owned by you" });
    }
    return res.status(200).json({ reservation });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(409).json({ error: error.message });
    }
    throw error;
  }
}
