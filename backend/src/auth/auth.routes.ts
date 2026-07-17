import { Router } from "express";
import {
  signupHandler,
  loginHandler,
  logoutHandler,
  profileHandler,
  passwordResetHandler,
  passwordResetConfirmHandler,
} from "./auth.handler.js";

const AuthRouter = Router();

AuthRouter.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

AuthRouter.post("/login", loginHandler);
AuthRouter.post("/signup", signupHandler);
AuthRouter.post("/logout", logoutHandler);
AuthRouter.post("/password-reset/request", passwordResetHandler);
AuthRouter.post("/password-reset/confirm", passwordResetConfirmHandler);
AuthRouter.get("/profile/me", profileHandler);
// app.get("/me");

export default AuthRouter;
