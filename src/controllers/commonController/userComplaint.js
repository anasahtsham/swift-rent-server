import db from "../../config/config.js";

// API 1: Register Complaint
export const registerComplaint = async (req, res) => {
  try {
    const { propertyID, userID, userType, sentToType, title, description } =
      req.body;

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

    // Notification to the receiver from the sender
    // Get the property address
    const propertyAddressQuery = `
      SELECT CONCAT(P.propertyAddress, ', ', A.areaName, ', ', C.cityName) AS address
      FROM Property P
      JOIN Area A ON P.areaID = A.id
      JOIN City C ON A.cityID = C.id
      WHERE P.id = $1;
    `;
    const propertyAddressResult = await db.query(propertyAddressQuery, [
      propertyID,
    ]);
    const propertyAddress = propertyAddressResult.rows[0].address;
    // Send notification to the tenant
    const tenantNotificationQuery = `
    INSERT INTO UserNotification (userID, userType, senderID, senderType, notificationText, notificationType)
      VALUES (
        $1, $2,
        $3, $4,
        'You have received a new complaint for the property at ${propertyAddress}.', 
        'C'
      );
    `;
    await db.query(tenantNotificationQuery, [
      receiverID,
      receiverType,
      userID,
      userType,
    ]);

    if (rows.length === 1) {
      return res.status(201).json({ success: "Complaint sent successfully." });
    } else {
      return res.status(500).json({ success: "Failed to send complaint." });
    }
  } catch (error) {
    console.error("Error sending complaint:", error);
    return res.status(500).json({ success: "Failed to send complaint." });
  }
};

// API 2: View Complaints
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
    return res.status(500).json({ success: "Failed to view complaints." });
  }
};

//API 3: Respond to Complaint
export const respondToComplaint = async (req, res) => {
  try {
    const { complaintID, remarkText } = req.body;

    //Get the senderID and senderType and receiverID and receiverType from complaintID
    const getComplaintDetailsQuery = `
      SELECT senderID, senderType, receiverID, receiverType, propertyID
      FROM Complaint
      WHERE id = $1;
    `;
    const complaintDetailsResult = await db.query(getComplaintDetailsQuery, [
      complaintID,
    ]);
    const senderID = complaintDetailsResult.rows[0].senderid;
    const senderType = complaintDetailsResult.rows[0].sendertype;
    const receiverID = complaintDetailsResult.rows[0].receiverid;
    const receiverType = complaintDetailsResult.rows[0].receivertype;

    // Get the propertyID
    const propertyID = complaintDetailsResult.rows[0].propertyid;

    //Notification to the sender from the receiver
    // Get the property address
    const propertyAddressQuery = `
      SELECT CONCAT(P.propertyAddress, ', ', A.areaName, ', ', C.cityName) AS address
      FROM Property P
      JOIN Area A ON P.areaID = A.id
      JOIN City C ON A.cityID = C.id
      WHERE P.id = $1;
    `;
    const propertyAddressResult = await db.query(propertyAddressQuery, [
      propertyID,
    ]);
    const propertyAddress = propertyAddressResult.rows[0].address;
    // Send notification to the tenant
    const tenantNotificationQuery = `
    INSERT INTO UserNotification (userID, userType, senderID, senderType, notificationText, notificationType)
      VALUES (
        $1, $2,
        $3, $4,
        'Your complaint for the property at ${propertyAddress} has been acknowledged.', 
        'C'
      );
    `;
    await db.query(tenantNotificationQuery, [
      senderID,
      senderType,
      receiverID,
      receiverType,
    ]);

    // Update complaint table with remark text and complaintStatus
    const updateComplaintQuery = `
        UPDATE Complaint
        SET complaintStatus = 'A', receiverRemark = $1, complaintResolvedOn = CURRENT_TIMESTAMP
        WHERE id = $2;
      `;
    await db.query(updateComplaintQuery, [remarkText, complaintID]);

    return res
      .status(200)
      .json({ success: "Complaint acknowledged successfully." });
  } catch (error) {
    console.error("Error acknowledging complaint:", error);
    return res
      .status(500)
      .json({ success: "Failed to acknowledge complaint." });
  }
};
