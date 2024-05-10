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
        WHERE PL.tenantID = $1 AND PL.leaseStatus = 'P'
        ORDER BY pl.id DESC;
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

    // Get propertyID from the lease
    const propertyID = rows[0].propertyid;

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

    // Create a notification for the registrar
    const createNotificationQuery = `
      INSERT INTO UserNotification (userID, userType, senderType, senderID, notificationText, notificationType)
      VALUES ($1, $2, 'T', $3, $4, 'L');
    `;
    await db.query(createNotificationQuery, [
      rows[0].registeredbyid,
      rows[0].registeredbytype,
      rows[0].tenantid,
      "Tenant has rejected lease for the property " +
        propertyAddress +
        " due to the reason: " +
        reasonForRejection,
    ]);

    // Send success response
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error rejecting lease:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//API 4: Accept Lease
export const acceptLease = async (req, res) => {
  const { leaseID } = req.body;

  try {
    // Check if lease status is pending
    const checkLeaseQuery = `SELECT leaseStatus FROM PropertyLease WHERE id = $1;`;
    const { rowCount, rows: checkLeaseRows } = await db.query(checkLeaseQuery, [
      leaseID,
    ]);

    if (rowCount === 0) {
      return res.status(400).json({ error: "Lease does not exist" });
    }

    if (checkLeaseRows[0].leasestatus !== "P") {
      return res.status(400).json({
        error: "Lease cannot be accepted as it is not in pending status",
      });
    }

    // Get lease information
    const getLeaseQuery = `
      SELECT
        pl.propertyID,
        pl.tenantID,
        pl.managerID,
        pl.rent,
        pl.dueDate,
        pl.fine,
        pl.advancePayment,
        pl.registeredByID,
        pl.registeredByType
      FROM PropertyLease pl
      WHERE pl.id = $1;
    `;
    const { rows } = await db.query(getLeaseQuery, [leaseID]);

    if (rows.length === 0) {
      return res.status(400).json({ error: "Lease does not exist" });
    }

    const {
      propertyid,
      tenantid,
      managerid,
      rent,
      duedate,
      fine,
      advancepayment,
      registeredbyid,
      registeredbytype,
    } = rows[0];

    // Update property table
    const updatePropertyQuery = `
      UPDATE Property
      SET tenantID = $1, propertyStatus = 'L'
      WHERE id = $2;
    `;
    await db.query(updatePropertyQuery, [tenantid, propertyid]);

    // Update PropertyLease table
    const updateLeaseQuery = `
      UPDATE PropertyLease
      SET leaseStatus = 'A', approvedByTenant = true
      WHERE id = $1;
    `;
    await db.query(updateLeaseQuery, [leaseID]);

    // Calculate rent amount for TenantRentNotice
    let rentAmount = 0;
    if (parseInt(advancepayment) === 0) {
      rentAmount = parseInt(rent);
    } else {
      rentAmount = parseInt(advancepayment);
    }

    // Insert into TenantRentNotice
    const insertNoticeQuery = `
      INSERT INTO TenantRentNotice (propertyID, tenantID, managerID, rentAmount, dueDate, fine, paymentStatus)
      VALUES ($1, $2, $3, $4, $5, $6, 'P');
    `;
    await db.query(insertNoticeQuery, [
      propertyid,
      tenantid,
      managerid,
      rentAmount,
      duedate,
      fine,
    ]);

    // Find out property address CONCAT(P.propertyAddress, ', ', A.areaName, ', ', C.cityName) AS address
    const propertyAddressQuery = `
      SELECT 
      CONCAT(P.propertyAddress, ', ', A.areaName, ', ', C.cityName) AS address
      FROM Property P
      JOIN Area A ON P.areaID = A.id
      JOIN City C ON A.cityID = C.id
      WHERE P.id = $1;
    `;
    const { rows: addressRows } = await db.query(propertyAddressQuery, [
      propertyid,
    ]);
    const propertyAddress = addressRows[0].address;

    // Create notification text
    const notificationTextRegistrar = `Tenant has accepted lease for the property: ${propertyAddress}`;

    // Send notifications
    const createRegistrarNotificationQuery = `
      INSERT INTO UserNotification (userID, userType, senderID, senderType, notificationText, notificationType)
      VALUES ($1, $2, $3, $4, $5, 'L');
    `;
    // Send notification to registrar
    await db.query(createRegistrarNotificationQuery, [
      registeredbyid,
      registeredbytype,
      tenantid,
      "T",
      notificationTextRegistrar,
    ]);

    // Send notifications
    const createTenantNotificationQuery = `
      INSERT INTO UserNotification (userID, userType, senderID, senderType, notificationText, notificationType)
      VALUES ($1, $2, $3, $4, $5, 'R');
    `;

    // Create notification text
    const notificationTextTenant = `Pay ${rentAmount} for the property: ${propertyAddress}`;

    // Get ownerID from property table
    const getOwnerIDQuery = `SELECT ownerID FROM Property WHERE id = $1;`;
    const { rows: ownerRows } = await db.query(getOwnerIDQuery, [propertyid]);
    const ownerid = ownerRows[0].ownerid;

    // Send notification to tenant
    await db.query(createTenantNotificationQuery, [
      tenantid,
      "T",
      ownerid,
      "O",
      notificationTextTenant,
    ]);

    // Get OwnerID and ManagerID from Property table
    const getOwnerManagerQuery = `SELECT ownerID, managerID FROM Property WHERE id = $1;`;
    const { rows: ownerManagerRows } = await db.query(getOwnerManagerQuery, [
      propertyid,
    ]);
    const ownerID = ownerManagerRows[0].ownerid;
    const managerID = ownerManagerRows[0].managerid;
    const tenantID = tenantid;

    // Create Rating Table for Owner to rate Tenant
    const createOwnerTenantRatingQuery = `
      INSERT INTO Rating (propertyID, userID, userType, ratedByID, ratedByType, ratingStatus)
      VALUES ($1, $2, 'O', $3, 'T', 'P');
    `;
    await db.query(createOwnerTenantRatingQuery, [
      propertyid,
      ownerID,
      tenantID,
    ]);

    // Create Rating Table for Tenant to rate Owner
    const createTenantOwnerRatingQuery = `
      INSERT INTO Rating (propertyID, userID, userType, ratedByID, ratedByType, ratingStatus)
      VALUES ($1, $2, 'T', $3, 'O', 'P');
    `;
    await db.query(createTenantOwnerRatingQuery, [
      propertyid,
      tenantID,
      ownerID,
    ]);

    if (managerID) {
      // Create Rating Table for Manager to rate Tenant
      const createManagerTenantRatingQuery = `
        INSERT INTO Rating (propertyID, userID, userType, ratedByID, ratedByType, ratingStatus)
        VALUES ($1, $2, 'M', $3, 'T', 'P');
      `;
      await db.query(createManagerTenantRatingQuery, [
        propertyid,
        managerID,
        tenantID,
      ]);

      // Create Rating Table for Tenant to rate Manager
      const createTenantManagerRatingQuery = `
        INSERT INTO Rating (propertyID, userID, userType, ratedByID, ratedByType, ratingStatus)
        VALUES ($1, $2, 'T', $3, 'M', 'P');
      `;
      await db.query(createTenantManagerRatingQuery, [
        propertyid,
        tenantID,
        managerID,
      ]);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error accepting lease:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
