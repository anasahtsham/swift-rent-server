import db from "../../config/config.js";
import { hashPassword } from "../../helpers/encryption.js";

// API 1: Users List
export const userList = async (req, res) => {
  try {
    const query = `
      SELECT id, 
        firstName, 
        lastName, 
        TO_CHAR(DOB, 'DD-MM-YYYY') AS dob, 
        phone, 
        email, 
        isManager, 
        isTenant, 
        isOwner, 
        isBanned, 
        TO_CHAR(registeredOn, 'DD-MM-YYYY HH24:MI:SS') AS registeredOn 
      FROM UserInformation
      ORDER BY id DESC;
    `;
    const { rows } = await db.query(query);
    res.status(200).json({ users: rows });
  } catch (error) {
    console.error("Error fetching users list:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// API 2: Edit a user
export const editUser = async (req, res) => {
  const {
    userID,
    firstName,
    lastName,
    dob,
    phone,
    email,
    isManager,
    isTenant,
    isOwner,
  } = req.body;

  // Check if all required fields are present
  if (!userID || !firstName || !lastName || !dob || !phone || !email) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    //Check if user exists
    const checkUserQuery = `SELECT * FROM UserInformation WHERE id = $1;`;
    const { rows } = await db.query(checkUserQuery, [userID]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const query = `
      UPDATE UserInformation
      SET firstName = $1, 
          lastName = $2, 
          dob = $3, 
          phone = $4, 
          email = $5, 
          isManager = $6, 
          isTenant = $7, 
          isOwner = $8
      WHERE id = $9;
    `;
    await db.query(query, [
      firstName,
      lastName,
      dob,
      phone,
      email,
      isManager,
      isTenant,
      isOwner,
      userID,
    ]);
    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error editing user:", error);
    if (error.code === "23505") {
      return res
        .status(400)
        .json({ error: "Email or Phone already registered to other user" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

// API 3: Ban User
export const banUser = async (req, res) => {
  const { userID } = req.body;

  try {
    //Check if user exists
    const checkUserQuery = `SELECT * FROM UserInformation WHERE id = $1;`;
    const { rows } = await db.query(checkUserQuery, [userID]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    //Check if user already banned
    if (rows[0].isbanned) {
      return res.status(400).json({ error: "User already banned" });
    }

    const query = `
      UPDATE UserInformation
      SET isBanned = TRUE
      WHERE id = $1;
    `;
    await db.query(query, [userID]);
    res.status(200).json({ message: "User banned successfully" });
  } catch (error) {
    console.error("Error banning user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// API 4: Unban User
export const unbanUser = async (req, res) => {
  const { userID } = req.body;

  try {
    //Check if user exists
    const checkUserQuery = `SELECT * FROM UserInformation WHERE id = $1;`;
    const { rows } = await db.query(checkUserQuery, [userID]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    //Check if user already unbanned
    if (!rows[0].isbanned) {
      return res.status(400).json({ error: "User already unbanned" });
    }

    const query = `
      UPDATE UserInformation
      SET isBanned = FALSE
      WHERE id = $1;
    `;
    await db.query(query, [userID]);
    res.status(200).json({ message: "User unbanned successfully" });
  } catch (error) {
    console.error("Error unbanning user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// API 5: Reset Password
export const resetPassword = async (req, res) => {
  var { userID, userPassword } = req.body;

  //Apply MD5 hashing to the password + salt
  var userPassword = hashPassword(userPassword);

  try {
    const query = `
      UPDATE UserInformation
      SET userPassword = $1
      WHERE id = $2;
    `;
    await db.query(query, [userPassword, userID]);
    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
