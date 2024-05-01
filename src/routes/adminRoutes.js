import express from "express";
const adminRouter = express.Router();

import * as authentication from "../controllers/adminController/authentication.js";
import * as areaManagement from "../controllers/adminController/areaManagement.js";
import * as complaintManagement from "../controllers/adminController/complaintManagement.js";
import * as userManagement from "../controllers/adminController/userManagement.js";

//Authentication
adminRouter.post("/login", authentication.login);
//Area Management
adminRouter.get("/city-list", areaManagement.cityList);
adminRouter.post("/add-city", areaManagement.addCity);
adminRouter.post("/delete-city", areaManagement.deleteCity);
adminRouter.post("/update-city", areaManagement.updateCity);
adminRouter.post("/area-list", areaManagement.areaList);
adminRouter.post("/add-area", areaManagement.addArea);
adminRouter.post("/delete-area", areaManagement.deleteArea);
adminRouter.post("/update-area", areaManagement.updateArea);
//Compaint Management
adminRouter.get("/complaint-list", complaintManagement.getAdminComplaints);
adminRouter.post("/set-in-progress", complaintManagement.setStatusInProgress);
adminRouter.post("/set-solved", complaintManagement.setStatusSolved);
adminRouter.post("/reject-complaint", complaintManagement.rejectComplaint);
//User Management
adminRouter.get("/user-list", userManagement.userList);
adminRouter.post("/edit-user", userManagement.editUser);
adminRouter.post("/ban-user", userManagement.banUser);
adminRouter.post("/un-ban-user", userManagement.unbanUser);
adminRouter.post("/reset-password", userManagement.resetPassword);

//Total adminRouter routes: 10

export default adminRouter;
