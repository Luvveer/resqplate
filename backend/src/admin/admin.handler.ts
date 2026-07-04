import type { Request, Response } from "express";
import {
  AdminRestaurantParamsSchema,
  AdminRestaurantStatusQuerySchema,
  AdminVerificationActionSchema,
} from "@resqplate/shared";
import {
  getRestaurantProfiles,
  getRestaurantProfile,
  approveRestaurant,
  rejectRestaurant,
  requestRestaurantInfo,
  suspendRestaurant,
} from "./admin.service.js";

export async function getRestaurantsHandler(req: Request, res: Response) {
  const query = AdminRestaurantStatusQuerySchema.parse(req.query);
  const restaurants = await getRestaurantProfiles(query.status);

  return res.status(200).json({ restaurants });
}

export async function getRestaurantHandler(req: Request, res: Response) {
  const params = AdminRestaurantParamsSchema.parse(req.params);
  const restaurant = await getRestaurantProfile(params.restaurantId);

  if (!restaurant) {
    return res.status(404).json({ error: "Restaurant profile not found" });
  }

  return res.status(200).json({ restaurant });
}

export async function approveRestaurantHandler(req: Request, res: Response) {
  const params = AdminRestaurantParamsSchema.parse(req.params);
  const body = AdminVerificationActionSchema.parse(req.body);

  try {
    const restaurant = await approveRestaurant(params.restaurantId, body);
    return res.status(200).json({ restaurant });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(404).json({ error: error.message });
    }

    throw error;
  }
}

export async function rejectRestaurantHandler(req: Request, res: Response) {
  const params = AdminRestaurantParamsSchema.parse(req.params);
  const body = AdminVerificationActionSchema.parse(req.body);

  try {
    const restaurant = await rejectRestaurant(params.restaurantId, body);
    return res.status(200).json({ restaurant });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(404).json({ error: error.message });
    }

    throw error;
  }
}

export async function requestRestaurantInfoHandler(
  req: Request,
  res: Response,
) {
  const params = AdminRestaurantParamsSchema.parse(req.params);
  const body = AdminVerificationActionSchema.parse(req.body);

  try {
    const restaurant = await requestRestaurantInfo(params.restaurantId, body);
    return res.status(200).json({ restaurant });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(404).json({ error: error.message });
    }

    throw error;
  }
}

export async function suspendRestaurantHandler(req: Request, res: Response) {
  const params = AdminRestaurantParamsSchema.parse(req.params);
  const body = AdminVerificationActionSchema.parse(req.body);

  try {
    const restaurant = await suspendRestaurant(params.restaurantId, body);
    return res.status(200).json({ restaurant });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(404).json({ error: error.message });
    }

    throw error;
  }
}
