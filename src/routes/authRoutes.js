import express from "express";
const authRouter = express.Router();

import * as authController from "../controllers/authController.js";

authRouter.post("/login", authController.login);
authRouter.post("/register", authController.registerAccount);
authRouter.post(
  "/register-alternate-role",
  authController.registerAlternateRole
);
authRouter.post("/verify-credentials", authController.verifyCredentials);

export default authRouter;
