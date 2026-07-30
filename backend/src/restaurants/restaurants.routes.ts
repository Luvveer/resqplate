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
  addressSuggestionsHandler,
  updateRestaurantHandler,
} from "./restaurants.handler.js";
import { uploadSingleImage } from "../middleware/upload.middleware.js";

const RestaurantRouter = Router();

/**
 * @openapi
 * /api/restaurants/profileres:
 *   get:
 *     tags:
 *       - Restaurants
 *     summary: Get the current business's restaurant profile
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Restaurant profile returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 restaurant:
 *                    $ref: '#/components/schemas/Restaurant'
 *       401:
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Restaurant profile doesnot exist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   patch:
 *     tags:
 *       - Restaurants
 *     summary: Update the restaurant profile details
 *     security:
 *       - sessionCookie: []
 *     requestBody:
 *        required: true
 *        content:
 *           application/json:
 *            schema:
 *              $ref: '#/components/schemas/UpdateRestaurantRequest'
 *     responses:
 *       200:
 *         description: Restaurant profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 restaurant:
 *                    $ref: '#/components/schemas/Restaurant'
 *       401:
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Restaurant profile doesnot exist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
RestaurantRouter.get(
  "/profileres",
  getSession,
  isBusiness,
  getRestaurantHandler,
);
RestaurantRouter.patch(
  "/profileres",
  getSession,
  isBusiness,
  updateRestaurantHandler,
);

/**
 * @openapi
 * /api/restaurants/address-suggestions:
 *   post:
 *     tags:
 *       - Restaurants
 *     summary: Get address autocomplete suggestion from Google Places
 *     security:
 *       - sessionCookie: []
 *     requestBody:
 *        required: true
 *        content:
 *           application/json:
 *            schema:
 *              $ref: '#/components/schemas/AddressAutocompleteRequest'
 *     responses:
 *       200:
 *         description: Suggestions returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  suggestions:
 *                    type: array
 *                    items:
 *                      $ref: '#/components/schemas/AddressSuggestion'
 *       400:
 *         description: Address search failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
RestaurantRouter.post(
  "/address-suggestions",
  getSession,
  isBusiness,
  addressSuggestionsHandler,
);

/**
 * @openapi
 * /api/restaurants/signup:
 *   post:
 *     tags:
 *       - Restaurants
 *     summary: Create a restaurant profile
 *     security:
 *       - sessionCookie: []
 *     requestBody:
 *        required: true
 *        content:
 *           application/json:
 *            schema:
 *              $ref: '#/components/schemas/CreateRestaurantRequest'
 *     responses:
 *       201:
 *         description: Restaurant profile created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 restaurant:
 *                    $ref: '#/components/schemas/Restaurant'
 *       401:
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Restaurant profile already exists for this account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
RestaurantRouter.post(
  "/signup",
  getSession,
  isBusiness,
  createRestaurantHandler,
);

/**
 * @openapi
 * /api/restaurants/listings:
 *   get:
 *     tags:
 *       - Restaurants
 *     summary: List the current restaurant's food listings
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Listings returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 listings:
 *                    type: array
 *                    items:
 *                      $ref: '#/components/schemas/FoodListing'
 *       401:
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Restaurant profile should be approved.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     tags:
 *       - Restaurants
 *     summary: Create a new food listing
 *     security:
 *       - sessionCookie: []
 *     requestBody:
 *        required: true
 *        content:
 *           application/json:
 *            schema:
 *              $ref: '#/components/schemas/CreateListingRequest'
 *     responses:
 *       201:
 *         description: Listing created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 listing:
 *                    $ref: '#/components/schemas/FoodListing'
 *       400:
 *         description: invalid pickup window or unknown allergen
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
RestaurantRouter.get("/listings", getSession, isBusiness, getMyListingsHandler);
RestaurantRouter.post(
  "/listings",
  getSession,
  isBusiness,
  createListingHandler,
);

/**
 * @openapi
 * /api/restaurants/listings/{listingId}:
 *   get:
 *     tags:
 *       - Restaurants
 *     summary: Get the restaurant listing based on the listingId
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: listingId
 *         required: true
 *         schema:
 *            type: string
 *            format: uuid
 *     responses:
 *       200:
 *         description: Listing returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 listing:
 *                    $ref: '#/components/schemas/FoodListing'
 *       401:
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Listing not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   patch:
 *     tags:
 *       - Restaurants
 *     summary: Update one of the current restaurant's listings
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: listingId
 *         required: true
 *         schema:
 *            type: string
 *            format: uuid
 *     requestBody:
 *        required: true
 *        content:
 *           application/json:
 *            schema:
 *              $ref: '#/components/schemas/UpdateListingRequest'
 *     responses:
 *       200:
 *         description: Listing updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 listing:
 *                    $ref: '#/components/schemas/FoodListing'
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @openapi
 * /api/restaurants/listings/{listingId}/image:
 *   put:
 *     tags:
 *       - Restaurants
 *     summary: Upload or replace a listing's image
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: listingId
 *         required: true
 *         schema:
 *            type: string
 *            format: uuid
 *     requestBody:
 *        required: true
 *        content:
 *           multipart/form-data:
 *            schema:
 *              type: object
 *              required:
 *                - image
 *              properties:
 *                image:
 *                  type: string
 *                  format: binary
 *     responses:
 *       200:
 *         description: Listing expired successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  listing:
 *                      $ref: '#/components/schemas/FoodListing'
 *       400:
 *         description: No image was provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Listing not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
RestaurantRouter.put(
  "/listings/:listingId/image",
  getSession,
  isBusiness,
  uploadSingleImage,
  updateListingImageHandler,
);

/**
 * @openapi
 * /api/restaurants/listings/{listingId}/expire:
 *   patch:
 *     tags:
 *       - Restaurants
 *     summary: Maark a lisiting as expired
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: listingId
 *         required: true
 *         schema:
 *            type: string
 *            format: uuid
 *     responses:
 *       200:
 *         description: Listing expired successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  listing:
 *                      $ref: '#/components/schemas/FoodListing'
 *       401:
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Listing not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
RestaurantRouter.patch(
  "/listings/:listingId/expire",
  getSession,
  isBusiness,
  expireListingHandler,
);

export default RestaurantRouter;
