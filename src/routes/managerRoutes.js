import express from "express";
const managerRouter = express.Router();

import * as managerController from "../controllers/managerController/managerController.js";

managerRouter.get("/get-cities", managerController.getCities);
managerRouter.get("/view-hire-requests", managerController.viewHireRequests);

export default managerRouter;
