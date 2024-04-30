import express from "express";
const tenantRouter = express.Router();

import * as tenantController from "../controllers/TenantController/tenantController.js";

tenantRouter.post("/lease-request", tenantController.getLeaseRequest);
tenantRouter.post(
  "/lease-request-detail",
  tenantController.getLeaseRequestDetail
);
tenantRouter.post("/lease-reject", tenantController.leaseReject);

export default tenantRouter;
