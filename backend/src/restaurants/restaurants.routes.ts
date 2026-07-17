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
  updateListingImageHandler,
} from "./restaurants.handler.js";
import { uploadSingleImage } from "../middleware/upload.middleware.js";

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

RestaurantRouter.put(
  "/listings/:listingId/image",
  getSession,
  isBusiness,
  uploadSingleImage,
  updateListingImageHandler,
);

RestaurantRouter.patch(
  "/listings/:listingId/expire",
  getSession,
  isBusiness,
  expireListingHandler,
);

export default RestaurantRouter;
