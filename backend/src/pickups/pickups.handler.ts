import type { Request, Response } from "express";
import { confirmPickup, getMyReservations } from "./pickups.service.js";
import {
  confirmPickupSchema,
  reservationParamsSchema,
  reservationStatusQuerySchema,
} from "@resqplate/shared";

export async function getReservationHandler(req: Request, res: Response) {
  if (!req.profile) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { status } = reservationStatusQuerySchema.parse(req.query);
  const reservations = await getMyReservations(req.profile.id, status);
  return res.status(200).json({ reservations });
}

export async function confirmPickupHandler(req: Request, res: Response) {
  if (!req.profile) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { reservationId } = reservationParamsSchema.parse(req.params);
  const { pickupCode } = confirmPickupSchema.parse(req.body);

  try {
    const confirm = await confirmPickup(
      req.profile.id,
      reservationId,
      pickupCode,
    );
    if (!confirm) {
      return res.status(404).json({ error: "Reservation not found" });
    }
    return res.status(200).json({ reservation: confirm });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(409).json({ error: error.message });
    }
    throw error;
  }
}
