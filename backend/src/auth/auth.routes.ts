import { Router } from "express";
import {
  signupHandler,
  loginHandler,
  logoutHandler,
  profileHandler,
  updateProfileHandler,
  passwordResetHandler,
  passwordResetConfirmHandler,
} from "./auth.handler.js";
import { getSession, isFoodSeeker } from "../middleware/auth.middleware.js";

const AuthRouter = Router();

AuthRouter.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login with email and password
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Logged In successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - profile
 *               properties:
 *                 profile:
 *                    $ref: '#/components/schemas/Profile'
 *       401:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
AuthRouter.post("/login", loginHandler);

/**
 * @openapi
 * /api/auth/signup:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Create a new account
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/SignupRequest'
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - profile
 *               properties:
 *                 profile:
 *                    $ref: '#/components/schemas/Profile'
 *       400:
 *         description: Signup Failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
AuthRouter.post("/signup", signupHandler);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Log Out a person
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Logged Out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                    type: string
 *                    example: Logged out
 */
AuthRouter.post("/logout", logoutHandler);

/**
 * @openapi
 * /api/auth/password-reset/request:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Requesting for a email to reset password
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/PasswordResetRequest'
 *     responses:
 *       200:
 *         description: Always a success to avoid revealing account existence
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                    type: string
 *                    example: If this email exists, a link was sent
 */
AuthRouter.post("/password-reset/request", passwordResetHandler);

/**
 * @openapi
 * /api/auth/password-reset/confirm:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Confirm the token and reset password
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/PasswordResetConfirmRequest'
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                  type: string
 *                  example: Password Updated
 *       400:
 *         description: Reset token is invalid or expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
AuthRouter.post("/password-reset/confirm", passwordResetConfirmHandler);

/**
 * @openapi
 * /api/auth/profile/me:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Get the users profile
 *     security:
 *        - sessionCookie: []
 *     responses:
 *       200:
 *         description: User profile returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profile:
 *                    $ref: '#/components/schemas/Profile'
 *       401:
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: No profile record was found
 *   patch:
 *     tags:
 *       - Auth
 *     summary: Update users profile
 *     security:
 *        - sessionCookie: []
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *          description: Profile updated successfully
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  profile:
 *                    $ref: '#/components/schemas/Profile'
 *       401:
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: No Profile exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
AuthRouter.get("/profile/me", profileHandler);
AuthRouter.patch("/profile/me", getSession, isFoodSeeker, updateProfileHandler);

export default AuthRouter;
