import { Router } from "express";
import { getSession, isAdmin } from "../middleware/auth.middleware.js";
import {
  getRestaurantsHandler,
  getRestaurantHandler,
  approveRestaurantHandler,
  rejectRestaurantHandler,
  requestRestaurantInfoHandler,
  suspendRestaurantHandler,
} from "./admin.handler.js";

const AdminRouter = Router();

/**
 * @openapi
 * /api/admin/restaurants:
 *   get:
 *     tags:
 *       - Admin
 *     summary: List restaurant profiles
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         description: Optional restaurant verification status filter.
 *         schema:
 *           $ref: '#/components/schemas/VerificationStatus'
 *     responses:
 *       200:
 *         description: Restaurant profiles returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - restaurants
 *               properties:
 *                 restaurants:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Restaurant'
 *       401:
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: User does not have the ADMIN role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
AdminRouter.get("/restaurants", getSession, isAdmin, getRestaurantsHandler);

/**
 * @openapi
 * /api/admin/restaurants/{restaurantId}:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get a restaurant profile
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         description: Unique identifier of the restaurant profile.
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Restaurant profile returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - restaurant
 *               properties:
 *                 restaurant:
 *                   $ref: '#/components/schemas/Restaurant'
 *       401:
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: User does not have the ADMIN role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Restaurant profile was not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
AdminRouter.get(
  "/restaurants/:restaurantId",
  getSession,
  isAdmin,
  getRestaurantHandler,
);

/**
 * @openapi
 * /api/admin/restaurants/{restaurantId}/approve:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Approve a restaurant
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         description: Unique identifier of the restaurant profile.
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: false
 *       description: Optional administrator notes about the approval.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminVerificationAction'
 *           examples:
 *             approved:
 *               summary: Approve with notes
 *               value:
 *                 adminNotes: Restaurant documents have been verified.
 *     responses:
 *       200:
 *         description: Restaurant approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - restaurant
 *               properties:
 *                 restaurant:
 *                   $ref: '#/components/schemas/Restaurant'
 *       401:
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: User does not have the ADMIN role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Restaurant was not found or the approval update failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
AdminRouter.patch(
  "/restaurants/:restaurantId/approve",
  getSession,
  isAdmin,
  approveRestaurantHandler,
);

/**
 * @openapi
 * /api/admin/restaurants/{restaurantId}/reject:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Reject a restaurant
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         description: Unique identifier of the restaurant profile.
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminVerificationAction'
 *     responses:
 *       200:
 *         description: Restaurant rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 restaurant:
 *                   $ref: '#/components/schemas/Restaurant'
 *       401:
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: User does not have the ADMIN role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Restaurant was not found or the update failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
AdminRouter.patch(
  "/restaurants/:restaurantId/reject",
  getSession,
  isAdmin,
  rejectRestaurantHandler,
);

/**
 * @openapi
 * /api/admin/restaurants/{restaurantId}/request-info:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Request additional restaurant information
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         description: Unique identifier of the restaurant profile.
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminVerificationAction'
 *     responses:
 *       200:
 *         description: Additional restaurant information requested successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 restaurant:
 *                   $ref: '#/components/schemas/Restaurant'
 *       401:
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: User does not have the ADMIN role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Restaurant was not found or the update failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
AdminRouter.patch(
  "/restaurants/:restaurantId/request-info",
  getSession,
  isAdmin,
  requestRestaurantInfoHandler,
);

/**
 * @openapi
 * /api/admin/restaurants/{restaurantId}/suspend:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Suspend a restaurant
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         description: Unique identifier of the restaurant profile.
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminVerificationAction'
 *     responses:
 *       200:
 *         description: Restaurant suspended successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 restaurant:
 *                   $ref: '#/components/schemas/Restaurant'
 *       401:
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: User does not have the ADMIN role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Restaurant was not found or the update failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
AdminRouter.patch(
  "/restaurants/:restaurantId/suspend",
  getSession,
  isAdmin,
  suspendRestaurantHandler,
);

export default AdminRouter;
