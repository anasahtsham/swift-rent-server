import express from "express";
const testRouter = express.Router();

import * as testController from "../tests/APITestController.js";

testRouter.post("/query", testController.testQuery);

export default testRouter;
