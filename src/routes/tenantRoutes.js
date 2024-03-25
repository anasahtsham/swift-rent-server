import express from "express";
const tenantRouter = express.Router();

import * as tenantController from "../controllers/tenantController.js";

tenantRouter.post("/login", tenantController.login);

export default tenantRouter;
