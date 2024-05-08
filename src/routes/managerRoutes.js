import express from "express";
const managerRouter = express.Router();

import * as managerController from "../controllers/managerController/managerController.js";
import * as rentController from "../controllers/managerController/rentController.js";

managerRouter.get("/get-cities", managerController.getCities);
managerRouter.get("/get-cities-dropdown", managerController.getCitiesDropdown);
managerRouter.post("/view-hire-requests", managerController.viewHireRequests);
managerRouter.post(
  "/detailed-hire-request",
  managerController.detailedHiringRequest
);
managerRouter.post(
  "/send-counter-request",
  managerController.generateCounterRequest
);
managerRouter.post(
  "/view-managed-properties",
  managerController.viewManagedProperties
);
//Rent Controller
managerRouter.post("/verify-online-rent", rentController.verifyOnlineRent);
managerRouter.post("/collect-rent", rentController.collectRent);

// Total APIs: 6

export default managerRouter;
