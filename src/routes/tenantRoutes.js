import express from "express";
const tenantRouter = express.Router();

import * as tenantRentalController from "../controllers/tenantController/tenantRentalController.js";
import * as tenantLeaseController from "../controllers/tenantController/tenantLease.js";
import * as rentController from "../controllers/tenantController/rentController.js";

tenantRouter.post("/lease-request", tenantLeaseController.getLeaseRequest); //1
tenantRouter.post(
  "/lease-request-detail",
  tenantLeaseController.getLeaseRequestDetail
); //2
tenantRouter.post("/lease-reject", tenantLeaseController.leaseReject); //3
tenantRouter.post("/lease-accept", tenantLeaseController.acceptLease); //4
tenantRouter.post("/list-of-rentals", tenantRentalController.listOfRentals); //5
//Rent Submissions
tenantRouter.post(
  "/submit-verification-request",
  rentController.submitVerificationRequest
); //6
tenantRouter.post(
  "/submit-collection-request",
  rentController.submitCollectionRequest
); //7

// Total APIs: 7

export default tenantRouter;
