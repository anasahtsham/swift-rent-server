import express from "express";
const tenantRouter = express.Router();

import * as tenantRentalController from "../controllers/TenantController/tenantRentalController.js";
import * as rentConteoller from "../controllers/TenantController/rentController.js";

tenantRouter.post("/lease-request", tenantRentalController.getLeaseRequest);
tenantRouter.post(
  "/lease-request-detail",
  tenantRentalController.getLeaseRequestDetail
);
tenantRouter.post("/lease-reject", tenantRentalController.leaseReject);
tenantRouter.post("/lease-accept", tenantRentalController.acceptLease);
tenantRouter.post("/list-of-rentals", tenantRentalController.listOfRentals);
//Rent Submissions
//submitVerificationRequest
tenantRouter.post(
  "/submit-verification-request",
  rentConteoller.submitVerificationRequest
);
tenantRouter.post(
  "/submit-collection-request",
  rentConteoller.submitCollectionRequest
);

// Total APIs: 5

export default tenantRouter;
