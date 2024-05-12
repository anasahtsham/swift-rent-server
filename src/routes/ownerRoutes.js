import express from "express";
const ownerRouter = express.Router();

import * as ownerController from "../controllers/ownerController/ownerPropertyController.js";
import * as maintenanceController from "../controllers/ownerController/maintenaceController.js";
import * as hireController from "../controllers/ownerController/hireController.js";
import * as rentController from "../controllers/ownerController/rentController.js";
import * as analyticsController from "../controllers/ownerController/analytics.js";

//Owner
ownerRouter.get("/fetch-property-data", ownerController.fetchPropertyData); //1
ownerRouter.post("/add-property", ownerController.addProperty); //2
ownerRouter.post("/fetch-property-list", ownerController.fetchPropertyList); //3
ownerRouter.post("/fetch-property-detail", ownerController.fetchPropertyDetail); //4
ownerRouter.post("/delete-property", ownerController.deleteProperty); //5

//Tenant
ownerRouter.post("/register-tenant", ownerController.registerTenant); //6
ownerRouter.post("/terminate-tenant", ownerController.terminateTenant); //7

//Maintenance
ownerRouter.post(
  "/generate-maintenance-report",
  maintenanceController.generateMaintenanceReport
); //8
ownerRouter.post(
  "/display-maintenance-reports",
  maintenanceController.displayMaintenanceReport
); //9
ownerRouter.post(
  "/display-all-maintenace-reports",
  maintenanceController.displayAllMaintenanceReports
); //10

//Hire Manager
ownerRouter.post(
  "/generate-hire-request",
  hireController.generateHiringRequest
); //11
ownerRouter.post(
  "/delete-hire-request",
  hireController.deleteManagerHireRequest
); //12
ownerRouter.post(
  "/view-counter-requests",
  hireController.viewManagerHireCounterRequests
); //13
ownerRouter.post(
  "/reject-counter-request",
  hireController.rejectCounterRequest
); //14
ownerRouter.post(
  "/interview-counter-request",
  hireController.inviteManagerForInterview
); //15
ownerRouter.post(
  "/accept-counter-request",
  hireController.acceptCounterRequest
); //16
ownerRouter.post("/fire-manager", hireController.fireManager); //17

//Rent
ownerRouter.post("/verify-online-rent", rentController.verifyOnlineRent); //18
ownerRouter.post("/collect-rent", rentController.collectRent); //19

//Analytics
ownerRouter.post("/home-analytics", analyticsController.homeAnalytics); //20
ownerRouter.post("/pending-list", analyticsController.pendingRentsList); //21
ownerRouter.post("/paid-list", analyticsController.paidRentsList); //22
ownerRouter.post("/detailed-analytics", analyticsController.detailedAnalytics); //23

// Total APIs: 23

export default ownerRouter;
