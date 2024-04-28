import express from "express";
const adminRouter = express.Router();

import * as authentication from "../controllers/adminController/authentication.js";
import * as areaManagement from "../controllers/adminController/areaManagement.js";
import * as complaintManagement from "../controllers/adminController/complaintManagement.js";

//Authentication
adminRouter.post("/login", authentication.login);
//Complaint Management
adminRouter.get("/city-list", areaManagement.cityList);
adminRouter.post("/add-city", areaManagement.addCity);
adminRouter.post("/delete-city", areaManagement.deleteCity);
adminRouter.post("/update-city", areaManagement.updateCity);
adminRouter.post("/area-list", areaManagement.areaList);
adminRouter.post("/add-area", areaManagement.addArea);
adminRouter.post("/delete-area", areaManagement.deleteArea);
adminRouter.post("/update-area", areaManagement.updateArea);

//Total adminRouter routes: 9

export default adminRouter;
