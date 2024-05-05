import express from "express";
const managerRouter = express.Router();

import * as managerController from "../controllers/managerController/managerController.js";

managerRouter.get("/get-cities", managerController.getCities);
managerRouter.get("/get-cities-dropdown", managerController.getCitiesDropdown);
managerRouter.get("/view-hire-requests", managerController.viewHireRequests);
managerRouter.post(
  "/detailed-hire-request",
  managerController.detailedHiringRequest
);

export default managerRouter;
