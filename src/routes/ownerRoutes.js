import express from "express";
const ownerRouter = express.Router();

import * as ownerController from "../controllers/ownerController.js";

ownerRouter.post("/login", ownerController.login);

export default ownerRouter;
