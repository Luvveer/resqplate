import { Router } from "express";
import {
  browseListingsHandler,
  getPublicListingHandler,
  getAllAllergensHandler,
} from "./listings.handler.js";
// import { browseListingsQuerySchema, listingParamsSchema } from "@resqplate/shared";

const ListingsRouter = Router();

/**
 * @openapi
 * /api/listings/allergens:
 *   get:
 *     tags:
 *     - Listings
 *     summary: List every allergen tag avaliable for filtering
 *     responses:
 *      200:
 *       description: All allergens
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - allergens
 *             properties:
 *               allergens:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Allergen'
 */
ListingsRouter.get("/allergens", getAllAllergensHandler);

/**
 * @openapi
 * /api/listings:
 *   get:
 *     tags:
 *     - Listings
 *     summary: browse avaliable food listings
 *     description: >
 *       Returns avaliable listings for seekers. Support filtering by city, category, free-text search, and allergen exclusion. When lat and lng are supplied together each listing is annotated with distanceKm and can be filtered by radiusKm and sorted by distance.
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         description: Free-text search across listing title and description.
 *         schema:
 *           type: string
 *       - in: query
 *         name: excludeAllergenIds
 *         description: Comma-separated allergen UUIDs to exclude from result.
 *         schema:
 *           type: string
 *       - in: query
 *         name: lat
 *         description: Seeker origin latitude. Must be sent together with lng.
 *         schema:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *       - in: query
 *         name: lng
 *         description: Seeker origin longitude. Must be sent together with lat.
 *         schema:
 *           type: number
 *           minimum: -180
 *           maximum: 180
 *       - in: query
 *         name: radiusKm
 *         description: Only return listings within this many km. Requires lat and lng.
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 500
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum:
 *             - distance
 *             - pickupEnd
 *     responses:
 *       200:
 *         description: Available listings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - listings
 *               properties:
 *                 listings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PublicListing'
 *       400:
 *         description: Invalid query (e.g. only one of lat/lng supplied)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// First the Get : browse the available listings for the seekers to view
ListingsRouter.get("/", browseListingsHandler);

/**
 * @openapi
 * /api/listings/{listingId}:
 *   get:
 *     tags:
 *     - Listings
 *     summary: Get a single public listing by id
 *     parameters:
 *       - in: path
 *         name: listingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: The requested listing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - listing
 *               properties:
 *                 listing:
 *                   $ref: '#/components/schemas/PublicListing'
 *       404:
 *         description: Listing not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// Secondly the Get for getting the details of a specific listing for the seeker to view
ListingsRouter.get("/:listingId", getPublicListingHandler);

export default ListingsRouter;
