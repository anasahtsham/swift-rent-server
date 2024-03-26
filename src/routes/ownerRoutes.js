import express from "express";
const ownerRouter = express.Router();

import * as ownerController from "../controllers/ownerController.js";

ownerRouter.post("/analytics-page", ownerController.login);

export default ownerRouter;
