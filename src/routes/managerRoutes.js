import express from "express";
const managerRouter = express.Router();

import * as managerController from "../controllers/managerController/managerController.js";
import * as rentController from "../controllers/managerController/rentController.js";

managerRouter.get("/get-cities", managerController.getCities); //1
managerRouter.get("/get-cities-dropdown", managerController.getCitiesDropdown); //2
managerRouter.post("/view-hire-requests", managerController.viewHireRequests); //3
managerRouter.post(
  "/detailed-hire-request",
  managerController.detailedHiringRequest
); //4
managerRouter.post(
  "/send-counter-request",
  managerController.generateCounterRequest
); //5
managerRouter.post(
  "/view-managed-properties",
  managerController.viewManagedProperties
); //6
//Rent Controller
managerRouter.post("/verify-online-rent", rentController.verifyOnlineRent); //7
managerRouter.post("/collect-rent", rentController.collectRent); //8
managerRouter.post(
  "/submit-verification-request",
  rentController.submitManagerVerificationRequest
); //9

// Total APIs: 9

export default managerRouter;
