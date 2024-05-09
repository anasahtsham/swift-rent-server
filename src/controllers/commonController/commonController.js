import db from "../../config/config.js";

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

//API 2: User Notifications
export const getUserNotifications = async (req, res) => {
  try {
    const { userID, userType } = req.body;

    // Query to retrieve user notifications
    const notificationsQuery = `
      SELECT UN.id, 
             TO_CHAR(UN.sentOn, 'DD-MM-YYYY') AS dateAndYear, 
             TO_CHAR(UN.sentOn, 'HH24:MI') AS time, 
             CONCAT(UI.firstName, ' ', UI.lastName) AS senderName, 
             UN.senderType, 
             UN.notificationText, 
             UN.notificationType
      FROM UserNotification UN
      JOIN UserInformation UI ON UN.senderID = UI.id
      WHERE UN.userID = $1 AND UN.userType = $2
      ORDER BY UN.sentOn DESC;
    `;

    const { rows } = await db.query(notificationsQuery, [userID, userType]);

    // Check if there are no notifications for the user
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No notifications found for the user" });
    }

    // Send notifications as JSON
    res.status(200).json({ notifications: rows });
  } catch (error) {
    console.error("Error retrieving notifications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
