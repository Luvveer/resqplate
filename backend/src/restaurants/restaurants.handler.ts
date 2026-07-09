import type { Request, Response } from "express";
import {
  createRestaurantSchema,
  createListingSchema,
  updateListingSchema,
  listingParamsSchema,
} from "@resqplate/shared";
import {
  getMyRestaurant,
  createMyRestaurant,
  getMyListings,
  getMyListing,
  createMyListing,
  updateMyListing,
  expireMyListing,
} from "./restaurants.service.js";

export async function getRestaurantHandler(req: Request, res: Response) {
  if (!req.profile) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const restaurant = await getMyRestaurant(req.profile.id);
  if (!restaurant) {
    return res.status(404).json({ error: "No restraunt profile found" });
  }
  return res.status(200).json({ restaurant });
}

export async function createRestaurantHandler(req: Request, res: Response) {
  if (!req.profile) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const body = createRestaurantSchema.parse(req.body);
  try {
    const restaurant = await createMyRestaurant(req.profile.id, body);
    return res.status(201).json({ restaurant });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(409).json({ error: error.message });
    }
    throw error;
  }
}

/* Feature 2 */

export async function getMyListingsHandler(req: Request, res: Response) {
  if (!req.profile) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  try {
    const listings = await getMyListings(req.profile.id);
    return res.status(200).json({ listings });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(403).json({ error: error.message });
    }
    throw error;
  }
}

export async function getMyListingHandler(req: Request, res: Response) {
  if (!req.profile) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const params = listingParamsSchema.parse(req.params);
  try {
    const listing = await getMyListing(req.profile.id, params.listingId);

    if (!listing) {
      return res.status(404).json({ error: "Food listing not found" });
    }

    return res.status(200).json({ listing });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(403).json({ error: error.message });
    }
    throw error;
  }
}

export async function createListingHandler(req: Request, res: Response) {
  if (!req.profile) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const body = createListingSchema.parse(req.body);
  try {
    const listing = await createMyListing(req.profile.id, body);
    return res.status(201).json({ listing });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    throw error;
  }
}

export async function updateListingHandler(req: Request, res: Response) {
  if (!req.profile) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const params = listingParamsSchema.parse(req.params);
  const body = updateListingSchema.parse(req.body);
  try {
    const listing = await updateMyListing(
      req.profile.id,
      params.listingId,
      body,
    );

    if (!listing) {
      return res.status(404).json({ error: "Food listing not found" });
    }

    return res.status(200).json({ listing });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    throw error;
  }
}

export async function expireListingHandler(req: Request, res: Response) {
  if (!req.profile) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const params = listingParamsSchema.parse(req.params);
  try {
    const listing = await expireMyListing(req.profile.id, params.listingId);

    if (!listing) {
      return res.status(404).json({ error: "Food listing not found" });
    }

    return res.status(200).json({ listing });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    throw error;
  }
}
