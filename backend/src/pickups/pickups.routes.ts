import { Router } from "express";
import { getSession, isBusiness } from "../middleware/auth.middleware.js";
import {
  getReservationHandler,
  confirmPickupHandler,
  markNoShowHandler,
  searchReservationHandler,
} from "./pickups.handler.js";

const PickupRouter = Router();

/**
 * @openapi
 * /api/pickups:
 *   get:
 *     tags:
 *       - Pickups
 *     summary: List reservations for the logged-in business
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         description: Optional reservation status filter.
 *         schema:
 *           $ref: '#/components/schemas/ReservationStatus'
 *     responses:
 *       200:
 *         description: Reservations returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - reservations
 *               properties:
 *                 reservations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Reservation'
 *       401:
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
PickupRouter.get("/", getSession, isBusiness, getReservationHandler);

/**
 * @openapi
 * /api/pickups/search:
 *   get:
 *     tags:
 *       - Pickups
 *     summary: Search this restaurant's reservations by seeker email
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         description: Exact email address of the seeker to search for.
 *         schema:
 *           type: string
 *           format: email
 *     responses:
 *       200:
 *         description: Matching reservations returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - reservations
 *               properties:
 *                 reservations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Reservation'
 *       401:
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
PickupRouter.get("/search", getSession, isBusiness, searchReservationHandler);

/**
 * @openapi
 * /api/pickups/{reservationId}/confirm:
 *   post:
 *     tags:
 *       - Pickups
 *     summary: Confirm a reservation pickup using the seeker's code
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: reservationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConfirmPickupInput'
 *     responses:
 *       200:
 *         description: Pickup confirmed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - reservation
 *               properties:
 *                 reservation:
 *                   $ref: '#/components/schemas/Reservation'
 *       401:
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Reservation not found or not owned by this restaurant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Reservation is not RESERVED, or the pickup code is incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

PickupRouter.post(
  "/:reservationId/confirm",
  getSession,
  isBusiness,
  confirmPickupHandler,
);
/**
 * @openapi
 * /api/pickups/{reservationId}/noShow:
 *   patch:
 *     tags:
 *       - Pickups
 *     summary: Mark a reservation as a no-show
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: reservationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reservation marked as a no-show
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - reservation
 *               properties:
 *                 reservation:
 *                   $ref: '#/components/schemas/Reservation'
 *       401:
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Reservation not found or not owned by this restaurant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Reservation is not RESERVED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
PickupRouter.patch(
  "/:reservationId/noShow",
  getSession,
  isBusiness,
  markNoShowHandler,
);

export default PickupRouter;
