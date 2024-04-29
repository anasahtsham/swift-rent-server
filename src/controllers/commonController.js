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

//API 2: Customer Support
export const customerSupport = async (req, res) => {
  const { senderID, senderType, complaintTitle, complaintDescription } =
    req.body;

  try {
    // Insert the input data into the AdminComplaint table
    await db.query(
      "INSERT INTO AdminComplaint (senderID, senderType, complaintTitle, complaintDescription, complaintStatus) VALUES ($1, $2, $3, $4, $5)",
      [senderID, senderType, complaintTitle, complaintDescription, "P"]
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error: ", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserNotifications = async (req, res) => {
  const { userID, userType } = req.body;

  try {
    // Find out all the notifications where the receiver id matches up with the provided userID and userType
    const notifications = await db.query(
      `SELECT 
        notificationText, 
        notificationType, 
        sentOn 
        FROM UserNotification 
        WHERE userID = $1 
        AND userType = $2 ORDER BY sentOn DESC`,
      [userID, userType]
    );

    // If no notifications are found, return an empty array
    if (notifications.rows.length === 0) {
      return res.status(200).json({ notifications: [] });
    }

    // Send the notifications to the client
    res.status(200).json({ notifications: notifications.rows });
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    res.status(500).json({ error: "Failed to fetch user notifications" });
  }
};
