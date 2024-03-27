import express from "express";
const ownerRouter = express.Router();

import * as ownerController from "../controllers/ownerController/ownerPropertyController.js";

ownerRouter.get("/fetch-property-data", ownerController.fetchPropertyData);
ownerRouter.post("/add-property", ownerController.addProperty);
ownerRouter.post("/fetch-property-list", ownerController.fetchPropertyList);

export default ownerRouter;