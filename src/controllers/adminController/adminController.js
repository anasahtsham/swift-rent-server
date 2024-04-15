import db from "../../config/config.js";
import { getCurrentMonthName } from "../../helpers/index.js";
import { md5 } from "js-md5";

//API 1: Admin Login
export const login = async (req, res) => {
  //Inputs
  const { userName, password } = req.body;
  if (userName == "admin" && password == "unpredictable69") {
    return res.status(200).json({ success: true });
  } else {
    return res.status(400).json({ error: "Incorrect Credentials" });
  }
};
