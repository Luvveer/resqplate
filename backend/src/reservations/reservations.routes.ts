import { Router } from "express";
import { getSession, isFoodSeeker } from "../middleware/auth.middleware.js";
import {
  createReservationHandler,
  cancelReservationHandler,
  getMyReservationsHandler,
} from "./reservations.handler.js";

const ReservationRouter = Router();

// Post : reserve one unit and space for a listing
ReservationRouter.post("/", getSession, isFoodSeeker, createReservationHandler);

// Get : get all the reservations for a given seeker
ReservationRouter.get("/", getSession, isFoodSeeker, getMyReservationsHandler);

// Patching: cancel a reservation for a given seeker and listing
ReservationRouter.patch(
  "/:reservationId/cancel",
  getSession,
  isFoodSeeker,
  cancelReservationHandler,
);

export default ReservationRouter;
