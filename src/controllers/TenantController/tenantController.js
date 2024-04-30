import db from "../../config/config.js";

//API 1: Fetch List of Lease Requests
export const getLeaseRequest = async (req, res) => {
  try {
    const { tenantID } = req.body;

    // Query to retrieve lease requests with full address
    const leaseRequestsQuery = `
        SELECT 
          PL.id AS id,
          CONCAT(P.propertyAddress, ', ', A.areaName, ', ', C.cityName) AS address,
          CONCAT(UI.firstName, ' ', UI.lastName) AS registrarName,
          CASE 
            WHEN PL.registeredByType = 'O' THEN 'Owner'
            WHEN PL.registeredByType = 'M' THEN 'Manager'
          END AS registrarType
        FROM PropertyLease PL
        JOIN Property P ON PL.propertyID = P.id
        JOIN UserInformation UI ON PL.registeredByID = UI.id
        JOIN Area A ON P.areaID = A.id
        JOIN City C ON A.cityID = C.id
        WHERE PL.tenantID = $1 AND PL.leaseStatus = 'P';
      `;

    const { rows } = await db.query(leaseRequestsQuery, [tenantID]);

    // Check if there are no lease requests for the tenant
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No lease requests found for the tenant" });
    }

    // Send lease requests as JSON
    res.status(200).json({ leaseRequests: rows });
  } catch (error) {
    console.error("Error retrieving lease requests:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//API 2: Fetch Lease Request Details
export const getLeaseRequestDetail = async (req, res) => {
  try {
    const { propertyLeaseID } = req.body;

    // Query to retrieve lease request details
    const leaseRequestDetailsQuery = `
      SELECT 
        P.propertyAddress,
        CONCAT(A.areaName, ', ', C.cityName) AS fullAddress,
        CONCAT(UI.firstName, ' ', UI.lastName) AS registrarName,
        CASE 
          WHEN PL.registeredByType = 'O' THEN 'Owner'
          WHEN PL.registeredByType = 'M' THEN 'Manager'
        END AS registrarType,
        TO_CHAR(PL.leaseCreatedOn, 'DD-MM-YYYY') AS leaseStartDate,
        PL.leasedForMonths,
        PL.incrementPeriod,
        PL.incrementPercentage,
        PL.rent,
        PL.securityDeposit,
        PL.advancePayment,
        PL.advancePaymentForMonths,
        PL.dueDate,
        PL.fine
      FROM PropertyLease PL
      JOIN Property P ON PL.propertyID = P.id
      JOIN Area A ON P.areaID = A.id
      JOIN City C ON A.cityID = C.id
      JOIN UserInformation UI ON PL.registeredByID = UI.id
      WHERE PL.id = $1;
    `;

    const { rows } = await db.query(leaseRequestDetailsQuery, [
      propertyLeaseID,
    ]);

    // Check if lease request details are found
    if (rows.length === 0) {
      return res.status(404).json({ error: "Lease request details not found" });
    }

    // Send lease request details as JSON
    res.status(200).json({ leaseRequestDetails: rows[0] });
  } catch (error) {
    console.error("Error retrieving lease request details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//API 3: Reject Lease
export const leaseReject = async (req, res) => {
  const { leaseID, reasonForRejection } = req.body;

  // Check if reasonForRejection is empty
  if (!reasonForRejection || reasonForRejection.trim().length === 0) {
    return res.status(400).json({ error: "Reason for rejection is required" });
  }

  try {
    // Check if the lease exists
    const checkLeaseQuery = `SELECT * FROM PropertyLease WHERE id = $1;`;
    const { rowCount, rows } = await db.query(checkLeaseQuery, [leaseID]);

    if (rowCount === 0) {
      return res.status(400).json({ error: "Lease does not exist" });
    }

    //Check if leaseStatus is not pending
    if (rows[0].leasestatus !== "P") {
      return res.status(400).json({
        error: "Lease cannot be rejected as it is not in pending status",
      });
    }

    // Update the lease status to rejected and set leaseEndedOn timestamp
    const updateLeaseQuery = `
      UPDATE PropertyLease
      SET leaseStatus = 'R', leaseEndedOn = CURRENT_TIMESTAMP, reasonForRejection = $1
      WHERE id = $2;
    `;
    await db.query(updateLeaseQuery, [reasonForRejection, leaseID]);

    // Create a notification for the registrar
    const createNotificationQuery = `
      INSERT INTO UserNotification (userID, userType, senderType, senderID, notificationText, notificationType)
      VALUES ($1, $2, 'T', $3, $4, 'L');
    `;
    await db.query(createNotificationQuery, [
      rows[0].registeredbyid,
      rows[0].registeredbytype,
      rows[0].tenantid,
      "Tenant has rejected lease for the reason: " + reasonForRejection,
    ]);

    // Send success response
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error rejecting lease:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
