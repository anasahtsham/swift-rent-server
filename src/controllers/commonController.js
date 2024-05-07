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
      SELECT 
      id,
      complaintTitle AS Title, 
      complaintDescription AS Description, 
      complaintStatus AS Status,
      TO_CHAR(createdOn, 'DD-MM-YYYY HH24:MI:SS') AS createdOn,
      TO_CHAR(complaintSolvedOn, 'DD-MM-YYYY HH24:MI:SS') AS complaintSolvedOn
      FROM AdminComplaint 
      WHERE senderID = $1 AND senderType = $2
      ORDER BY id DESC;
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

// API 5: Register Complaint
export const registerComplaint = async (req, res) => {
  try {
    const { propertyID, userID, userType, sentToType, title, description } =
      req.body;

    console.log(req.body);

    // Check if the sentToType exists on the property
    let receiverID;
    let receiverType;
    if (sentToType === "M" || sentToType === "T") {
      const receiverIDQuery = `
        SELECT managerID, tenantID
        FROM Property
        WHERE id = $1;
      `;
      const receiverIDResult = await db.query(receiverIDQuery, [propertyID]);
      if (sentToType === "M") {
        receiverID = receiverIDResult.rows[0].managerid;
      } else if (sentToType === "T") {
        receiverID = receiverIDResult.rows[0].tenantid;
      }
      receiverType = sentToType;
    } else if (sentToType === "O") {
      const ownerIDQuery = `
        SELECT ownerID
        FROM Property
        WHERE id = $1;
      `;
      const ownerIDResult = await db.query(ownerIDQuery, [propertyID]);
      receiverID = ownerIDResult.rows[0].ownerid;
      receiverType = "O";
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid sentToType." });
    }
    receiverType = sentToType;

    // Set the title, description, and complaintStatus
    const insertComplaintQuery = `
      INSERT INTO Complaint (propertyID, receiverID, receiverType, senderID, senderType, complaintTitle, complaintDescription, complaintStatus)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'P')
      RETURNING id;
    `;
    const { rows } = await db.query(insertComplaintQuery, [
      propertyID,
      receiverID,
      receiverType,
      userID,
      userType,
      title,
      description,
    ]);

    if (rows.length === 1) {
      return res
        .status(201)
        .json({ success: true, message: "Complaint sent successfully." });
    } else {
      return res
        .status(500)
        .json({ success: false, message: "Failed to send complaint." });
    }
  } catch (error) {
    console.error("Error sending complaint:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to send complaint." });
  }
};

// API 6: View Complaints
export const viewComplaints = async (req, res) => {
  try {
    const { userID, userType } = req.body;

    // Query for sent complaints
    const sentComplaintsQuery = `
      SELECT c.id, c.complaintTitle, c.complaintDescription, 
        TO_CHAR(c.createdOn, 'DD-MM-YYYY HH24:MI') as createdOn, 
        TO_CHAR(c.complaintResolvedOn, 'DD-MM-YYYY HH24:MI') as complaintResolvedOn,  
        c.complaintStatus, c.receiverRemark, 
        CONCAT(u.firstName, ' ', u.lastName) as receiverName,
        c.receiverType,
        CONCAT(p.propertyAddress, ', ', a.areaName, ', ', ci.cityName) as fullAddress
      FROM Complaint c
      JOIN UserInformation u ON c.receiverID = u.id
      JOIN Property p ON c.propertyID = p.id
      JOIN Area a ON p.areaID = a.id
      JOIN City ci ON a.cityID = ci.id
      WHERE c.senderID = $1 AND c.senderType = $2
      ORDER BY c.complaintStatus DESC, c.createdOn DESC;
    `;
    const sentComplaintsResult = await db.query(sentComplaintsQuery, [
      userID,
      userType,
    ]);

    // Query for received complaints
    const receivedComplaintsQuery = `
      SELECT c.id, c.complaintTitle, c.complaintDescription, 
        TO_CHAR(c.createdOn, 'DD-MM-YYYY HH24:MI') as createdOn, 
        TO_CHAR(c.complaintResolvedOn, 'DD-MM-YYYY HH24:MI') as complaintResolvedOn, 
        c.complaintStatus, c.receiverRemark, 
        CONCAT(u.firstName, ' ', u.lastName) as senderName,
        c.senderType,
        CONCAT(p.propertyAddress, ', ', a.areaName, ', ', ci.cityName) as fullAddress
      FROM Complaint c
      JOIN UserInformation u ON c.senderID = u.id
      JOIN Property p ON c.propertyID = p.id
      JOIN Area a ON p.areaID = a.id
      JOIN City ci ON a.cityID = ci.id
      WHERE c.receiverID = $1 AND c.receiverType = $2
      ORDER BY c.complaintStatus DESC, c.createdOn DESC;
    `;
    const receivedComplaintsResult = await db.query(receivedComplaintsQuery, [
      userID,
      userType,
    ]);

    return res.status(200).json({
      sentComplaints: sentComplaintsResult.rows,
      receivedComplaints: receivedComplaintsResult.rows,
    });
  } catch (error) {
    console.error("Error viewing complaints:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to view complaints." });
  }
};

//API 7: Respond to Complaint
export const respondToComplaint = async (req, res) => {
  try {
    const { complaintID, remarkText } = req.body;

    // Update complaint table with remark text and complaintStatus
    const updateComplaintQuery = `
      UPDATE Complaint
      SET complaintStatus = 'A', receiverRemark = $1, complaintResolvedOn = CURRENT_TIMESTAMP
      WHERE id = $2;
    `;
    await db.query(updateComplaintQuery, [remarkText, complaintID]);

    return res
      .status(200)
      .json({ success: true, message: "Complaint acknowledged successfully." });
  } catch (error) {
    console.error("Error acknowledging complaint:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to acknowledge complaint." });
  }
};
