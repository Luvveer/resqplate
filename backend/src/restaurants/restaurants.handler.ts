import type { Request, Response } from "express";
import { createRestaurantSchema } from "@resqplate/shared";
import { getMyRestaurant, createMyRestaurant } from "./restaurants.service.js";

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
