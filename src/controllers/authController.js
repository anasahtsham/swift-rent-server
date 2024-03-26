import db from "../config/config.js";
import { getCurrentMonthName } from "../helpers/index.js";
import { md5 } from "js-md5";

//API 1: Register Account
export const registerAccount = async (req, res) => {
  try {
    const {
      userType,
      firstName,
      lastName,
      DOB,
      email,
      phone,
      userPassword: userPassword,
    } = req.body;
    console.log(req.body);

    // Check if all required fields are provided
    if (
      !userType ||
      !firstName ||
      !lastName ||
      !DOB ||
      !email ||
      !phone ||
      !userPassword
    ) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Insert the new user information into the database
    const query = `
      INSERT INTO UserInformation 
      (firstName, lastName, DOB, phone, email, userPassword, isManager, isOwner, isTenant)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;
    const values = [
      firstName,
      lastName,
      DOB,
      phone,
      email,
      userPassword,
      userType === "manager",
      userType === "owner",
      userType === "tenant",
    ];

    const { rows } = await db.query(query, values);

    if (rows.length === 0) {
      return res.status(500).json({ error: "Failed to register account." });
    }

    const userID = rows[0].id;
    return res.status(201).json({ userID, success: true });
  } catch (error) {
    console.error("Error in registering account:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const login = async (req, res) => {
  const { emailOrPhone, userPassword } = req.body;
  try {
    // Check if all required fields are provided
    if (!emailOrPhone || !userPassword) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Check if the email or number exists in the User table
    const userQuery = await db.query(
      "SELECT * FROM UserInformation WHERE email = $1 OR phone = $1",
      [emailOrPhone]
    );
    if (userQuery.rows.length === 0) {
      // User not found
      return res.status(401).json({ error: "Email or Phone incorrect!" });
    }

    const user = userQuery.rows[0];

    // Check if the provided password matches the stored password
    if (user.userpassword !== userPassword) {
      return res.status(401).json({ error: "Password does not match!" });
    }

    // Return the user ID, userType, and success status
    return res.status(200).json({ userID: user.id, success: true });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
