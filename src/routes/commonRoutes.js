import express from "express";
const commonRouter = express.Router();

import * as commonController from "../controllers/commonController.js";

commonRouter.post("/get-user-profile", commonController.getUserProfile);

//Total commonRouter routes: 1

export default commonRouter;
