import express from "express";
const ownerRouter = express.Router();

import * as ownerController from "../controllers/ownerController/ownerPropertyController.js";
import * as maintenanceController from "../controllers/ownerController/maintenaceController.js";
import * as hireController from "../controllers/ownerController/hireController.js";
import * as rentController from "../controllers/ownerController/rentController.js";

//Owner
ownerRouter.get("/fetch-property-data", ownerController.fetchPropertyData); //1
ownerRouter.post("/add-property", ownerController.addProperty); //2
ownerRouter.post("/fetch-property-list", ownerController.fetchPropertyList); //3
ownerRouter.post("/fetch-property-detail", ownerController.fetchPropertyDetail); //4

//Tenant
ownerRouter.post("/register-tenant", ownerController.registerTenant); //5
ownerRouter.post("/terminate-tenant", ownerController.terminateTenant); //6

//Maintenance
ownerRouter.post(
  "/generate-maintenance-report",
  maintenanceController.generateMaintenanceReport
); //7
ownerRouter.post(
  "/display-maintenance-reports",
  maintenanceController.displayMaintenanceReport
); //8
ownerRouter.post(
  "/display-all-maintenace-reports",
  maintenanceController.displayAllMaintenanceReports
); //9

//Hire Manager
ownerRouter.post(
  "/generate-hire-request",
  hireController.generateHiringRequest
); //10
ownerRouter.post(
  "/delete-hire-request",
  hireController.deleteManagerHireRequest
); //11
ownerRouter.post(
  "/view-counter-requests",
  hireController.viewManagerHireCounterRequests
); //12
ownerRouter.post(
  "/reject-counter-request",
  hireController.rejectCounterRequest
); //13
ownerRouter.post(
  "/interview-counter-request",
  hireController.inviteManagerForInterview
); //14
ownerRouter.post(
  "/accept-counter-request",
  hireController.acceptCounterRequest
); //15
ownerRouter.post("/fire-manager", hireController.fireManager); //16

//Rent
ownerRouter.post("/verify-online-rent", rentController.verifyOnlineRent); //17
ownerRouter.post("/collect-rent", rentController.collectRent); //18

// Total APIs: 17

export default ownerRouter;
