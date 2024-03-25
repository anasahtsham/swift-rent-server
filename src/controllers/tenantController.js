import db from "../config/config.js";
import { getCurrentMonthName } from "../helpers/index.js";
import { md5 } from "js-md5";

export const login = async (req, res) => {
  //Inputs
  const { userName, password } = req.body;
  if (userName === "admin" && password === "unpredictable69") {
    console.log("tenant login");
    return res.status(200).json({ success: true });
  } else {
    return res.status(400).json({ error: "Incorrect Credentials" });
  }
};
