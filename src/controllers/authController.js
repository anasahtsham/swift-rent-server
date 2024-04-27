import db from "../config/config.js";
import { getCurrentMonthName } from "../helpers/index.js";
import { md5 } from "js-md5";
import dotenv from "dotenv";

dotenv.config();

//Auth API 1: Register Account
export const registerAccount = async (req, res) => {
  try {
    const { userType, firstName, lastName, DOB, email, phone, userPassword } =
      req.body;

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

    //Apply MD5 hashing to the password + salt
    var hashedPassword = userPassword + process.env.SALT;
    console.log("before salting: " + hashedPassword);
    //Apply 10 salting rounds using md5
    for (let i = 0; i < 10; i++) {
      hashedPassword = md5(hashedPassword);
    }
    console.log("after salting: " + hashedPassword);

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
      hashedPassword,
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

//Auth API 2: Login
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

    //Apply MD5 hashing to the password + salt
    var hashedPassword = userPassword + process.env.SALT;
    console.log("before salting: " + hashedPassword);
    //Apply 10 salting rounds using md5
    for (let i = 0; i < 10; i++) {
      hashedPassword = md5(hashedPassword);
    }
    console.log("after salting: " + hashedPassword);

    // Check if the provided password matches the stored password
    if (user.userpassword !== hashedPassword) {
      return res.status(401).json({ error: "Password does not match!" });
    }

    // Return the user ID, userType, and success status
    return res.status(200).json({
      userID: user.id,
      isOwner: user.isowner,
      isManager: user.ismanager,
      isTenant: user.istenant,
      success: true,
    });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

//Auth API 3: Register Alternate Role
export const registerAlternateRole = async (req, res) => {
  try {
    const { userID, userType } = req.body;
    if (!userID || !userType) {
      return res.status(400).json({ error: "All fields are required." });
    }
    //Check if the spelling of the userType is correct
    if (!["manager", "owner", "tenant"].includes(userType)) {
      return res.status(400).json({ error: "Invalid user type." });
    }

    //Check if the user already has the role
    const query = `
      SELECT * FROM UserInformation
      WHERE id = $1 AND is${
        userType.charAt(0).toUpperCase() + userType.slice(1)
      } = true
    `;
    const { rows } = await db.query(query, [userID]);
    if (rows.length > 0) {
      return res.status(400).json({ error: "User already has this role." });
    }

    //Register the user with the new role, but keep the previous roles
    const updateQuery = await db.query(
      `
      UPDATE UserInformation
      SET is${userType} = true
      WHERE id = $1
    `,
      [userID]
    );
    //Check if the update was successful
    if (updateQuery.rowCount === 0) {
      return res.status(500).json({ error: "Failed to register role." });
    }

    //Return success status
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in registering different role:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

//Auth API 4: Verify Credentials: Check if the email and phone provided are not already present in the database
export const verifyCredentials = async (req, res) => {
  try {
    const { email, phone } = req.body;

    //Check if the email is already present
    const emailQuery = await db.query(
      "SELECT * FROM UserInformation WHERE email = $1",
      [email]
    );
    if (emailQuery.rows.length > 0) {
      return res.status(400).json({ error: "Credentials in use." });
    }

    //Check if the phone is already present
    const phoneQuery = await db.query(
      "SELECT * FROM UserInformation WHERE phone = $1",
      [phone]
    );
    if (phoneQuery.rows.length > 0) {
      return res.status(400).json({ error: "Credentials in use." });
    }

    //Return success status
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in verifying credentials:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

//Auth API 5: Change Password: grab old password, new password, and user ID
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, userID } = req.body;

    //Check if the old password matches the stored password
    const query = `
      SELECT * FROM UserInformation
      WHERE id = $1 AND userPassword = $2
    `;
    const { rows } = await db.query(query, [userID, oldPassword]);
    if (rows.length === 0) {
      return res.status(401).json({ error: "Old password incorrect." });
    }

    //Update the password
    const updateQuery = await db.query(
      `
      UPDATE UserInformation
      SET userPassword = $1
      WHERE id = $2
    `,
      [newPassword, userID]
    );

    //Check if the update was successful
    if (updateQuery.rowCount === 0) {
      return res.status(500).json({ error: "Failed to change password." });
    }

    //Return success status
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in changing password:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};
