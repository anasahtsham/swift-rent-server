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

//API 3: User Notifications
export const getUserNotifications = async (req, res) => {
  try {
    const { userID, userType } = req.body;

    // Query to retrieve user notifications
    const notificationsQuery = `
      SELECT UN.id, 
             TO_CHAR(UN.sentOn, 'MM/DD/YYYY') AS dateAndYear, 
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

//API 4: View Customer Support Request Status
export const CustomerSupportStatus = async (req, res) => {
  const { userID, userType } = req.body;

  try {
    // Check if the user exists
    const checkUserQuery = `
      SELECT * FROM UserInformation 
      WHERE id = $1;
    `;
    const { rowCount: userCount, rows } = await db.query(checkUserQuery, [
      userID,
    ]);

    if (userCount === 0) {
      return res.status(400).json({ error: "User does not exist" });
    }

    // Retrieve customer support requests submitted by the user
    const customerSupportRequestsQuery = `
      SELECT complaintTitle AS Title, complaintDescription AS Description, complaintStatus AS Status
      FROM AdminComplaint 
      WHERE senderID = $1 AND senderType = $2;
    `;
    const { rows: customerSupportRequests } = await db.query(
      customerSupportRequestsQuery,
      [userID, userType]
    );

    // Send the customer support requests as JSON
    res.status(200).json({ customerSupportRequests });
  } catch (error) {
    console.error("Error viewing customer support request status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
