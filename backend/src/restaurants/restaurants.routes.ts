import { Router } from "express";
import { getSession, isBusiness } from "../middleware/auth.middleware.js";
import {
  getRestaurantHandler,
  createRestaurantHandler,
} from "./restaurants.handler.js";

const RestaurantRouter = Router();

RestaurantRouter.get("/me", getSession, isBusiness, getRestaurantHandler);
RestaurantRouter.post(
  "/signup",
  getSession,
  isBusiness,
  createRestaurantHandler,
);

export default RestaurantRouter;
