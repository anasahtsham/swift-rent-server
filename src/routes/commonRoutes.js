import express from "express";
const commonRouter = express.Router();

import * as commonController from "../controllers/commonController/commonController.js";
import * as customrSupport from "../controllers/commonController/customerSupport.js";
import * as userComplaint from "../controllers/commonController/userComplaint.js";

commonRouter.post("/get-user-profile-info", commonController.getUserProfile);
commonRouter.post(
  "/get-user-notifications",
  commonController.getUserNotifications
);
// Customer Support
commonRouter.post("/customer-support", customrSupport.customerSupport);
commonRouter.post(
  "/customer-support-status",
  customrSupport.CustomerSupportStatus
);
// Complaints
commonRouter.post("/register-complaint", userComplaint.registerComplaint);
commonRouter.post("/view-complaints", userComplaint.viewComplaints);
commonRouter.post("/respond-to-complaint", userComplaint.respondToComplaint);

// Total APIs: 5

export default commonRouter;
