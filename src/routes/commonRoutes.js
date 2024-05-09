import express from "express";
const commonRouter = express.Router();

import * as commonController from "../controllers/commonController/commonController.js";
import * as customrSupport from "../controllers/commonController/customerSupport.js";
import * as userComplaint from "../controllers/commonController/userComplaint.js";

commonRouter.post("/get-user-profile-info", commonController.getUserProfile); //1
commonRouter.post(
  "/get-user-notifications",
  commonController.getUserNotifications
); //2
// Customer Support
commonRouter.post("/customer-support", customrSupport.customerSupport); //3
commonRouter.post(
  "/customer-support-status",
  customrSupport.CustomerSupportStatus
); //4
// Complaints
commonRouter.post("/register-complaint", userComplaint.registerComplaint); //5
commonRouter.post("/view-complaints", userComplaint.viewComplaints); //6
commonRouter.post("/respond-to-complaint", userComplaint.respondToComplaint); //7

// Total APIs: 7

export default commonRouter;
