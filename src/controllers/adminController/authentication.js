import dotenv from "dotenv";
dotenv.config();

//API 1: Admin Login
export const login = async (req, res) => {
  //Inputs
  const { userName, password } = req.body;
  if (
    userName == process.env.ADMIN_USERNAME &&
    password == process.env.ADMIN_PASS
  ) {
    return res.status(200).json({ success: true });
  } else {
    return res.status(400).json({ error: "Incorrect Credentials" });
  }
};
