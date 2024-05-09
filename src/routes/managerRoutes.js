import express from "express";
const managerRouter = express.Router();

import * as managerHireController from "../controllers/managerController/managerHireController.js";
import * as managerPropertyController from "../controllers/managerController/managerPropertyController.js";
import * as rentController from "../controllers/managerController/rentController.js";

managerRouter.get("/get-cities", managerHireController.getCities); //1
managerRouter.get(
  "/get-cities-dropdown",
  managerHireController.getCitiesDropdown
); //2
managerRouter.post(
  "/view-hire-requests",
  managerHireController.viewHireRequests
); //3
managerRouter.post(
  "/detailed-hire-request",
  managerHireController.detailedHiringRequest
); //4
managerRouter.post(
  "/send-counter-request",
  managerHireController.generateCounterRequest
); //5
managerRouter.post(
  "/view-managed-properties",
  managerPropertyController.viewManagedProperties
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
