import express from "express";
const authRouter = express.Router();

import * as authController from "../controllers/authController.js";

authRouter.post("/login", authController.login);

export default authRouter;
