import { Router } from "express";
import {
  browseListingsHandler,
  getPublicListingHandler,
  getAllAllergensHandler,
} from "./listings.handler.js";
// import { browseListingsQuerySchema, listingParamsSchema } from "@resqplate/shared";

const ListingsRouter = Router();

ListingsRouter.get("/allergens", getAllAllergensHandler);

// First the Get : browse the available listings for the seekers to view
ListingsRouter.get("/", browseListingsHandler);

// Secondly the Get for getting the details of a specific listing for the seeker to view
ListingsRouter.get("/:listingId", getPublicListingHandler);

export default ListingsRouter;
