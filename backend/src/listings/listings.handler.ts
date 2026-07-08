import type { Request, Response } from "express";
import {
  browseListingsQuerySchema,
  listingParamsSchema,
} from "@resqplate/shared";
import { browseListings, getPublicListing } from "./listings.service.js";

// The get API for listings

//The buidl for the public seeker's home page
export async function browseListingsHandler(req: Request, res: Response) {
  // even the allergy would be taken care of coz of before
  const query = browseListingsQuerySchema.parse(req.query);
  const listings = await browseListings(query);
  return res.status(200).json({ listings });
}

// The get API for a specific listing

export async function getPublicListingHandler(req: Request, res: Response) {
  const params = listingParamsSchema.parse(req.params);
  const listing = await getPublicListing(params.listingId);
  if (!listing) {
    return res
      .status(404)
      .json({ error: "Sorry!! Your requested food listing was not found" });
  }
  return res.status(200).json({ listing });
}
