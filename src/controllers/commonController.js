import db from "../config/config.js";

//API 1: Get Profile Information
export const getUserProfile = async (req, res) => {
  const { userID } = req.body;

  try {
    // Grab user's information from the database
    const userInfo = await db.query(
      "SELECT firstName, lastName, email, phone FROM UserInformation WHERE id = $1",
      [userID]
    );

    if (userInfo.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Concatenate first and last name to form the full name
    const fullName = `${userInfo.rows[0].firstname} ${userInfo.rows[0].lastname}`;

    // Prepare the response object
    const userProfile = {
      name: fullName,
      email: userInfo.rows[0].email,
      phone: userInfo.rows[0].phone,
    };

    return res.status(200).json({
      userProfile,
      success: true,
    });
  } catch (error) {
    console.error("Error in getUserProfile controller:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
