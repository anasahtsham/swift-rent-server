import express from "express";
const tenantRouter = express.Router();

import * as tenantController from "../controllers/TenantController/tenantController.js";

tenantRouter.post("/lease-request", tenantController.getLeaseRequest);
tenantRouter.post(
  "/lease-request-detail",
  tenantController.getLeaseRequestDetail
);

export default tenantRouter;
