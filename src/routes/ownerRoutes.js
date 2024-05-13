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
ownerRouter.post("/delete-lease-request", ownerController.deleteLeaseRequest); //7
ownerRouter.post("/terminate-tenant", ownerController.terminateTenant); //8

//Maintenance
ownerRouter.post(
  "/generate-maintenance-report",
  maintenanceController.generateMaintenanceReport
); //9
ownerRouter.post(
  "/display-maintenance-reports",
  maintenanceController.displayMaintenanceReport
); //10
ownerRouter.post(
  "/display-all-maintenace-reports",
  maintenanceController.displayAllMaintenanceReports
); //11

//Hire Manager
ownerRouter.post(
  "/generate-hire-request",
  hireController.generateHiringRequest
); //12
ownerRouter.post(
  "/delete-hire-request",
  hireController.deleteManagerHireRequest
); //13
ownerRouter.post(
  "/view-counter-requests",
  hireController.viewManagerHireCounterRequests
); //14
ownerRouter.post(
  "/reject-counter-request",
  hireController.rejectCounterRequest
); //15
ownerRouter.post(
  "/interview-counter-request",
  hireController.inviteManagerForInterview
); //16
ownerRouter.post(
  "/accept-counter-request",
  hireController.acceptCounterRequest
); //17
ownerRouter.post("/fire-manager", hireController.fireManager); //18

//Rent
ownerRouter.post("/verify-online-rent", rentController.verifyOnlineRent); //19
ownerRouter.post("/collect-rent", rentController.collectRent); //20

//Analytics
ownerRouter.post("/home-analytics", analyticsController.homeAnalytics); //21
ownerRouter.post("/pending-list", analyticsController.pendingRentsList); //22
ownerRouter.post("/paid-list", analyticsController.paidRentsList); //23
ownerRouter.post("/detailed-analytics", analyticsController.detailedAnalytics); //24

// Total APIs: 24

export default ownerRouter;
