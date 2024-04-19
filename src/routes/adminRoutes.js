import express from "express";
const adminRouter = express.Router();

import * as authentication from "../controllers/adminController/authentication.js";
import * as management from "../controllers/adminController/management.js";

adminRouter.post("/login", authentication.login);
adminRouter.get("/cityList", management.cityList);
adminRouter.post("/addCity", management.addCity);
adminRouter.post("/deleteCity", management.deleteCity);
adminRouter.post("/updateCity", management.updateCity);
adminRouter.post("/areaList", management.areaList);
adminRouter.post("/addArea", management.addArea);
adminRouter.post("/deleteArea", management.deleteArea);
adminRouter.post("/updateArea", management.updateArea);

export default adminRouter;
