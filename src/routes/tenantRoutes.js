import express from "express";
const tenantRouter = express.Router();

import * as tenantRentalController from "../controllers/tenantController/tenantRentalController.js";
import * as tenantLeaseController from "../controllers/tenantController/tenantLease.js";
import * as rentController from "../controllers/tenantController/rentController.js";

tenantRouter.post("/lease-request", tenantLeaseController.getLeaseRequest);
tenantRouter.post(
  "/lease-request-detail",
  tenantLeaseController.getLeaseRequestDetail
);
tenantRouter.post("/lease-reject", tenantLeaseController.leaseReject);
tenantRouter.post("/lease-accept", tenantLeaseController.acceptLease);
tenantRouter.post("/list-of-rentals", tenantRentalController.listOfRentals);
//Rent Submissions
tenantRouter.post(
  "/submit-verification-request",
  rentController.submitVerificationRequest
);
tenantRouter.post(
  "/submit-collection-request",
  rentController.submitCollectionRequest
);

// Total APIs: 5

export default tenantRouter;
