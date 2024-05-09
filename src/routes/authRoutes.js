import express from "express";
const authRouter = express.Router();

import * as authController from "../controllers/authController.js";

authRouter.post("/login", authController.login); //1
authRouter.post("/register", authController.registerAccount); //2
authRouter.post(
  "/register-alternate-role",
  authController.registerAlternateRole
); //3
authRouter.post("/verify-credentials", authController.verifyCredentials); //4
authRouter.post("/change-password", authController.changePassword); //5
authRouter.post("/forgot-password", authController.forgotPassword); //6
authRouter.post("/switch-role", authController.switchRole); //7
authRouter.post("/check-ban", authController.checkBan); //8

// Total APIs: 8

export default authRouter;
