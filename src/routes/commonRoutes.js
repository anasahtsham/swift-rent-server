import express from "express";
const commonRouter = express.Router();

import * as commonController from "../controllers/commonController.js";

commonRouter.post("/get-user-profile-info", commonController.getUserProfile);
commonRouter.post("/customer-support", commonController.customerSupport);
commonRouter.post(
  "/get-user-notifications",
  commonController.getUserNotifications
);
commonRouter.post(
  "/customer-support-status",
  commonController.CustomerSupportStatus
);

//Total commonRouter routes: 3

export default commonRouter;
