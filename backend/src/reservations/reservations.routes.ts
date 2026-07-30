import { Router } from "express";
import { getSession, isFoodSeeker } from "../middleware/auth.middleware.js";
import {
  createReservationHandler,
  cancelReservationHandler,
  getMyReservationsHandler,
} from "./reservations.handler.js";

const ReservationRouter = Router();

/**
 * @openapi
 * /api/reservations:
 *   post:
 *     tags:
 *     - Reservations
 *     summary: Reserve one unit of a listing
 *     security:
 *      - sessionCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReservationInput'
 *     responses:
 *       201:
 *         description: Reservation created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - reservation
 *               properties:
 *                 reservation:
 *                   $ref: '#/components/schemas/Reservation'
 *       400:
 *         description: Invalid request body
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Authenticated user is not a food seeker
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
 *       409:
 *         description: Reservation could not be made: the listing is unavaliable or expired, the pickup slot is invalid, or the seeker already has a active reservation for this listing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   get:
 *     tags:
 *       - Reservations
 *     summary: List the current seeker's reservations
 *     security:
 *      - sessionCookie: []
 *     responses:
 *       200:
 *         description: The seeker's reservations with their listing details
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
 *                     $ref: '#/components/schemas/ReservationWithListing'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Authenticated user is not a food seeker
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// Post : reserve one unit and space for a listing
ReservationRouter.post("/", getSession, isFoodSeeker, createReservationHandler);

// Get : get all the reservations for a given seeker
ReservationRouter.get("/", getSession, isFoodSeeker, getMyReservationsHandler);

/**
 * @openapi
 * /api/reservations/{reservationId}/cancel:
 *   patch:
 *     tags:
 *       - Reservations
 *     summary: Cancel one of the seeker's reservations
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
 *         description: The cancelled reservation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - reservation
 *               properties:
 *                 reservation:
 *                   $ref: '#/components/schemas/Reservation'
 *       400:
 *         description: Invalid reservation id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Authenticated user is not a food seeker
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Reservation not found or owned by you
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Reservation could not be cancelled: the reservation is already cancelled or the listing has expired or picked up
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// Patching: cancel a reservation for a given seeker and listing
ReservationRouter.patch(
  "/:reservationId/cancel",
  getSession,
  isFoodSeeker,
  cancelReservationHandler,
);

export default ReservationRouter;
