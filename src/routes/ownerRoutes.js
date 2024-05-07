import express from "express";
const ownerRouter = express.Router();

import * as ownerController from "../controllers/ownerController/ownerPropertyController.js";
import * as maintenanceController from "../controllers/ownerController/maintenaceController.js";
import * as hireController from "../controllers/ownerController/hireController.js";

ownerRouter.get("/fetch-property-data", ownerController.fetchPropertyData);
ownerRouter.post("/add-property", ownerController.addProperty);
ownerRouter.post("/fetch-property-list", ownerController.fetchPropertyList);
ownerRouter.post("/register-tenant", ownerController.registerTenant);
//Maintenance
ownerRouter.post(
  "/generate-maintenance-report",
  maintenanceController.generateMaintenanceReport
);
ownerRouter.post(
  "/display-maintenance-reports",
  maintenanceController.displayMaintenanceReport
);
ownerRouter.post(
  "/display-all-maintenace-reports",
  maintenanceController.displayAllMaintenanceReports
);
//Hire Manager
ownerRouter.post(
  "/generate-hire-request",
  hireController.generateHiringRequest
);
ownerRouter.post(
  "/delete-hire-request",
  hireController.deleteManagerHireRequest
);
ownerRouter.post(
  "/view-counter-requests",
  hireController.viewManagerHireCounterRequests
);
ownerRouter.post(
  "/reject-counter-request",
  hireController.rejectCounterRequest
);
ownerRouter.post(
  "/interview-counter-request",
  hireController.inviteManagerForInterview
);
ownerRouter.post(
  "/accept-counter-request",
  hireController.acceptCounterRequest
);
ownerRouter.post("/fire-manager", hireController.fireManager);

//Total ownerRouter routes: 7

export default ownerRouter;
