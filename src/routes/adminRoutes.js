import express from "express";
const adminRouter = express.Router();

import * as adminController from "../controllers/adminController.js";

adminRouter.post("/login", adminController.login);

export default adminRouter;
