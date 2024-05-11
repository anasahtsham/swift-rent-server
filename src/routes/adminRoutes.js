import express from "express";
const adminRouter = express.Router();

import * as authentication from "../controllers/adminController/authentication.js";
import * as areaManagement from "../controllers/adminController/areaManagement.js";
import * as complaintManagement from "../controllers/adminController/complaintManagement.js";
import * as userManagement from "../controllers/adminController/userManagement.js";
import * as analytics from "../controllers/adminController/analytics.js";
import * as propertyManagement from "../controllers/adminController/propertyManagement.js";

//Authentication
adminRouter.post("/login", authentication.login); //1
//Area Management
adminRouter.get("/city-list", areaManagement.cityList); //2
adminRouter.post("/add-city", areaManagement.addCity); //3
adminRouter.post("/delete-city", areaManagement.deleteCity); //4
adminRouter.post("/update-city", areaManagement.updateCity); //5
adminRouter.post("/area-list", areaManagement.areaList); //6
adminRouter.post("/add-area", areaManagement.addArea); //7
adminRouter.post("/delete-area", areaManagement.deleteArea); //8
adminRouter.post("/update-area", areaManagement.updateArea); //9
//Compaint Management
adminRouter.get("/complaint-list", complaintManagement.getAdminComplaints); //10
adminRouter.post("/set-in-progress", complaintManagement.setStatusInProgress); //11
adminRouter.post("/set-solved", complaintManagement.setStatusSolved); //12
adminRouter.post("/reject-complaint", complaintManagement.rejectComplaint); //13
//User Management
adminRouter.get("/user-list", userManagement.userList); //14
adminRouter.post("/edit-user", userManagement.editUser); //15
adminRouter.post("/ban-user", userManagement.banUser); //16
adminRouter.post("/un-ban-user", userManagement.unbanUser); //17
adminRouter.post("/reset-password", userManagement.resetPassword); //18
//Analytics
adminRouter.get("/pie-chart-analytics", analytics.getAnalyticsPieCharts); //19
adminRouter.get("/sunburst-analytics", analytics.getPropertyStatusesWithCities); //20
adminRouter.get(
  "/h-s-bar-graph-analytics",
  analytics.getPropertyTypesPerCityAnalytics
); //21
//lineGraph
adminRouter.get("/line-graph", analytics.lineGraph); //22
//Property Management
//viewPropertyList
adminRouter.get("/view-property-list", propertyManagement.viewPropertyList); //22

//Total adminRouter routes: 21

export default adminRouter;
