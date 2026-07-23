import { Router } from "express";
import { getSession, isBusiness } from "../middleware/auth.middleware.js";
import {
  getReservationHandler,
  confirmPickupHandler,
  markNoShowHandler,
  searchReservationHandler,
} from "./pickups.handler.js";

const PickupRouter = Router();

PickupRouter.get("/", getSession, isBusiness, getReservationHandler);

PickupRouter.get("/search", getSession, isBusiness, searchReservationHandler);

PickupRouter.post(
  "/:reservationId/confirm",
  getSession,
  isBusiness,
  confirmPickupHandler,
);

PickupRouter.patch(
  "/:reservationId/noShow",
  getSession,
  isBusiness,
  markNoShowHandler,
);

export default PickupRouter;
