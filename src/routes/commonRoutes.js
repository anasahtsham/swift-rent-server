import express from "express";
const commonRouter = express.Router();

import * as commonController from "../controllers/commonController.js";

commonRouter.post("/get-user-profile-info", commonController.getUserProfile);
commonRouter.post("/customer-support", commonController.customerSupport);

//Total commonRouter routes: 2

export default commonRouter;
