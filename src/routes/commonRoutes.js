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
//registerComplaint
commonRouter.post("/register-complaint", commonController.registerComplaint);
//viewComplaints
commonRouter.post("/view-complaints", commonController.viewComplaints);
//respondToComplaint
commonRouter.post("/respond-to-complaint", commonController.respondToComplaint);

// Total APIs: 5

export default commonRouter;
