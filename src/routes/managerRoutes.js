import express from "express";
const managerRouter = express.Router();

import * as managerController from "../controllers/managerController.js";

managerRouter.post("/login", managerController.login);
export default managerRouter;
