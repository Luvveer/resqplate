import { Router } from "express";
import { getSession, isBusiness } from "../middleware/auth.middleware.js";
import {
  getRestaurantHandler,
  createRestaurantHandler,
  getMyListingsHandler,
  getMyListingHandler,
  createListingHandler,
  updateListingHandler,
  expireListingHandler,
} from "./restaurants.handler.js";

const RestaurantRouter = Router();

RestaurantRouter.get(
  "/profileres",
  getSession,
  isBusiness,
  getRestaurantHandler,
);
RestaurantRouter.post(
  "/signup",
  getSession,
  isBusiness,
  createRestaurantHandler,
);

/* Feature 2 */
RestaurantRouter.get("/listings", getSession, isBusiness, getMyListingsHandler);

RestaurantRouter.post(
  "/listings",
  getSession,
  isBusiness,
  createListingHandler,
);

RestaurantRouter.get(
  "/listings/:listingId",
  getSession,
  isBusiness,
  getMyListingHandler,
);

RestaurantRouter.patch(
  "/listings/:listingId",
  getSession,
  isBusiness,
  updateListingHandler,
);

RestaurantRouter.patch(
  "/listings/:listingId/expire",
  getSession,
  isBusiness,
  expireListingHandler,
);

export default RestaurantRouter;
