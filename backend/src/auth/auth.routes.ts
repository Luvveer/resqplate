import { Router } from "express";
import {
  signupHandler,
  loginHandler,
  logoutHandler,
  profileHandler,
} from "./auth.handler.js";

const AuthRouter = Router();

AuthRouter.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
AuthRouter.post("/login", loginHandler);
AuthRouter.post("/signup", signupHandler);
AuthRouter.post("/logout", logoutHandler);
AuthRouter.get("/profile/me", profileHandler);
// app.post("/password-reset/request");
// app.post("/password-reset/confirm");
// app.get("/me");

export default AuthRouter;
