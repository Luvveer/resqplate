import { Router } from "express";
import { getSession, isAdmin } from "../middleware/auth.middleware.js";
import {
  getRestaurantsHandler,
  getRestaurantHandler,
  approveRestaurantHandler,
  rejectRestaurantHandler,
  requestRestaurantInfoHandler,
  suspendRestaurantHandler,
} from "./admin.handler.js";

const AdminRouter = Router();

AdminRouter.get("/restaurants", getSession, isAdmin, getRestaurantsHandler);

AdminRouter.get(
  "/restaurants/:restaurantId",
  getSession,
  isAdmin,
  getRestaurantHandler,
);

AdminRouter.patch(
  "/restaurants/:restaurantId/approve",
  getSession,
  isAdmin,
  approveRestaurantHandler,
);

AdminRouter.patch(
  "/restaurants/:restaurantId/reject",
  getSession,
  isAdmin,
  rejectRestaurantHandler,
);

AdminRouter.patch(
  "/restaurants/:restaurantId/request-info",
  getSession,
  isAdmin,
  requestRestaurantInfoHandler,
);

AdminRouter.patch(
  "/restaurants/:restaurantId/suspend",
  getSession,
  isAdmin,
  suspendRestaurantHandler,
);

export default AdminRouter;
