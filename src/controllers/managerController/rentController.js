import db from "../../config/config.js";

//API 1: Verify Online Rent
export const verifyOnlineRent = async (req, res) => {
  try {
    const { managerID, propertyID, collectedAmount } = req.body;

    // Find the tenantID associated with the property
    const propertyQuery = `
        SELECT ownerID, tenantID
        FROM Property
        WHERE id = $1;
      `;
    const propertyResult = await db.query(propertyQuery, [propertyID]);
    const ownerID = propertyResult.rows[0].ownerid;
    const tenantID = propertyResult.rows[0].tenantid;

    // Find the latest TenantRentNotice with paymentStatus 'V'
    const rentNoticeQuery = `
        SELECT id
        FROM TenantRentNotice
        WHERE tenantID = $1 AND EXTRACT(MONTH FROM createdOn) = EXTRACT(MONTH FROM CURRENT_TIMESTAMP)
        AND EXTRACT(YEAR FROM createdOn) = EXTRACT(YEAR FROM CURRENT_TIMESTAMP)
        AND paymentStatus = 'V' AND propertyID = $2
        ORDER BY createdOn DESC
        LIMIT 1;
      `;
    const rentNoticeResult = await db.query(rentNoticeQuery, [
      tenantID,
      propertyID,
    ]);

    // If no online rent to verify
    if (rentNoticeResult.rows.length === 0) {
      return res.status(400).json({ success: "No online rent to verify." });
    }

    const rentNoticeID = rentNoticeResult.rows[0].id;

    // Calculate manager's cut
    const managerCutQuery = `
        SELECT salaryPaymentType as managersCutType, 
        salaryFixed as managersCutValueF,
        salaryPercentage as managersCutValueP
        FROM ManagerHireRequest
        WHERE propertyID = $1 AND managerID = $2;
      `;
    const managerCutResult = await db.query(managerCutQuery, [
      propertyID,
      managerID,
    ]);
    const { managerscuttype, managerscutvaluef, managerscutvaluep } =
      managerCutResult.rows[0];
    let managersCut = 0;

    if (managerscuttype === "F") {
      managersCut = managerscutvaluef;
    } else if (managerscuttype === "P") {
      // Calculate percentage based on collectedAmount
      managersCut = (collectedAmount * managerscutvaluep) / 100;
    }

    // Update TenantRentNotice table
    const updateRentNoticeQuery = `
        UPDATE TenantRentNotice
        SET paymentStatus = 'C',
        submittedAmount = $1
        WHERE id = $2;
      `;
    await db.query(updateRentNoticeQuery, [collectedAmount, rentNoticeID]);

    // Create ManagerRentCollection entry
    const createCollectionQuery = `
        INSERT INTO ManagerRentCollection (tenantRentNoticeID, managerID, collectedAmount, managersCut, paymentStatus)
        VALUES ($1, $2, $3, $4, 'P');
      `;
    await db.query(createCollectionQuery, [
      rentNoticeID,
      managerID,
      collectedAmount,
      managersCut,
    ]);

    // Get Property Address
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

    // Send notification to owner
    const notificationMessage = `Manager has verified online rent for the property ${propertyAddress}.`;
    const notificationQuery = `
      INSERT INTO UserNotification (userID, userType, senderID, senderType, notificationText, notificationType)
      VALUES ($1, 'O', $2, 'M', $3, 'R');
    `;
    await db.query(notificationQuery, [
      ownerID,
      managerID,
      notificationMessage,
    ]);

    // Send notification to tenant
    const tenantNotificationMessage = `Manager has verified online rent for the property ${propertyAddress}.`;
    const tenantNotificationQuery = `
      INSERT INTO UserNotification (userID, userType, senderID, senderType, notificationText, notificationType)
      VALUES ($1, 'T', $2, 'M', $3, 'R');
    `;
    await db.query(tenantNotificationQuery, [
      tenantID,
      managerID,
      tenantNotificationMessage,
    ]);

    return res
      .status(200)
      .json({ success: "Online rent verified successfully." });
  } catch (error) {
    console.error("Error verifying online rent:", error);
    return res.status(500).json({ success: "Failed to verify online rent." });
  }
};

//API 2: Collect Rent
export const collectRent = async (req, res) => {
  try {
    const { managerID, propertyID, collectedAmount } = req.body;

    // Find the tenantID associated with the property
    const propertyQuery = `
        SELECT tenantID
        FROM Property
        WHERE id = $1;
      `;
    const propertyResult = await db.query(propertyQuery, [propertyID]);
    const tenantID = propertyResult.rows[0].tenantid;

    // Find the latest TenantRentNotice with paymentStatus 'T'
    const rentNoticeQuery = `
        SELECT id
        FROM TenantRentNotice
        WHERE tenantID = $1 AND EXTRACT(MONTH FROM createdOn) = EXTRACT(MONTH FROM CURRENT_TIMESTAMP)
        AND EXTRACT(YEAR FROM createdOn) = EXTRACT(YEAR FROM CURRENT_TIMESTAMP)
        AND paymentStatus = 'T' AND propertyID = $2
        ORDER BY createdOn DESC
        LIMIT 1;
      `;
    const rentNoticeResult = await db.query(rentNoticeQuery, [
      tenantID,
      propertyID,
    ]);

    if (rentNoticeResult.rows.length === 0) {
      return res.status(400).json({ success: "No rent to collect." });
    }

    const rentNoticeID = rentNoticeResult.rows[0].id;

    // Calculate manager's cut
    const managerCutQuery = `
        SELECT salaryPaymentType as managersCutType, 
        salaryFixed as managersCutValueF,
        salaryPercentage as managersCutValueP
        FROM ManagerHireRequest
        WHERE propertyID = $1 AND managerID = $2;
      `;
    const managerCutResult = await db.query(managerCutQuery, [
      propertyID,
      managerID,
    ]);
    const { managerscuttype, managerscutvaluef, managerscutvaluep } =
      managerCutResult.rows[0];
    let managersCut = 0;

    if (managerscuttype === "F") {
      managersCut = managerscutvaluef;
    } else if (managerscuttype === "P") {
      // Calculate percentage based on collectedAmount
      managersCut = (collectedAmount * managerscutvaluep) / 100;
    }

    // Create ManagerRentCollection entry
    const createCollectionQuery = `
    INSERT INTO ManagerRentCollection (tenantRentNoticeID, managerID, collectedAmount, managersCut, paymentStatus)
    VALUES ($1, $2, $3, $4, 'P');
      `;
    await db.query(createCollectionQuery, [
      rentNoticeID,
      managerID,
      collectedAmount,
      managersCut,
    ]);

    // Update TenantRentNotice table
    const updateRentNoticeQuery = `
        UPDATE TenantRentNotice
        SET paymentStatus = 'C', paymentOn = CURRENT_TIMESTAMP,
        submittedAmount = $1
        WHERE id = $2;
      `;
    await db.query(updateRentNoticeQuery, [collectedAmount, rentNoticeID]);

    // Get Property Address
    const propertyAddressQuery = `
        SELECT CONCAT(P.propertyAddress, ', ', A.areaName, ', ', C.cityName) AS address,
        p.ownerID
        FROM Property P
        JOIN Area A ON P.areaID = A.id
        JOIN City C ON A.cityID = C.id
        WHERE P.id = $1;
      `;
    const propertyAddressResult = await db.query(propertyAddressQuery, [
      propertyID,
    ]);
    const propertyAddress = propertyAddressResult.rows[0].address;
    const ownerID = propertyAddressResult.rows[0].ownerid;

    // Send notification to owner
    const notificationMessage = `Manager has collected rent for the property ${propertyAddress}.`;
    const notificationQuery = `
        INSERT INTO UserNotification (userID, userType, senderID, senderType, notificationText, notificationType)
        VALUES ($1, 'O', $2, 'M', $3, 'R');
      `;
    await db.query(notificationQuery, [
      ownerID,
      managerID,
      notificationMessage,
    ]);

    // Send notification to tenant
    const tenantNotificationMessage = `Manager has collected rent for the property ${propertyAddress}.`;
    const tenantNotificationQuery = `
        INSERT INTO UserNotification (userID, userType, senderID, senderType, notificationText, notificationType)
        VALUES ($1, 'T', $2, 'M', $3, 'R');
      `;
    await db.query(tenantNotificationQuery, [
      tenantID,
      managerID,
      tenantNotificationMessage,
    ]);

    return res.status(200).json({ success: "Rent collected successfully." });
  } catch (error) {
    console.error("Error collecting rent:", error);
    return res.status(500).json({ success: "Failed to collect rent." });
  }
};

// API 3: Online Verification Request
export const submitManagerVerificationRequest = async (req, res) => {
  try {
    const { managerID, propertyID, verificationMessage } = req.body;

    // Find ownerID
    const ownerIDQuery = `
      SELECT ownerID , tenantID
      FROM Property
      WHERE id = $1;
    `;
    const ownerIDResult = await db.query(ownerIDQuery, [propertyID]);
    const ownerID = ownerIDResult.rows[0].ownerid;
    const tenantID = ownerIDResult.rows[0].tenantid;

    // Send notification to owner
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

    // Find last TenantRentNotice for the property
    const lastRentNoticeQuery = `
      SELECT TRN.id AS rentNoticeID
      FROM TenantRentNotice TRN
      JOIN ManagerRentCollection MRC ON TRN.id = MRC.tenantRentNoticeID
      WHERE TRN.propertyID = $1 
      AND EXTRACT(MONTH FROM TRN.createdOn) = EXTRACT(MONTH FROM CURRENT_TIMESTAMP)
      AND EXTRACT(YEAR FROM TRN.createdOn) = EXTRACT(YEAR FROM CURRENT_TIMESTAMP) 
      AND TRN.paymentStatus = 'C'
      ORDER BY TRN.createdOn DESC
      LIMIT 1;
    `;
    const lastRentNoticeResult = await db.query(lastRentNoticeQuery, [
      propertyID,
    ]);

    const rentNoticeID = lastRentNoticeResult.rows[0].rentnoticeid;

    if (lastRentNoticeResult.rows.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No rent to verify." });
    }

    // Check if manager has already submitted a request
    const checkRequestQuery = `
      SELECT *
      FROM ManagerRentCollection
      WHERE tenantRentNoticeID = $1
      AND (paymentStatus = 'V' OR paymentStatus = 'C');
    `;
    const checkRequestResult = await db.query(checkRequestQuery, [
      rentNoticeID,
    ]);

    if (checkRequestResult.rows.length > 0) {
      return res.status(400).json({
        success: "Manager has already submitted a request.",
      });
    }

    // Update ManagerRentCollection table
    const updateManagerCollectionQuery = `
      UPDATE ManagerRentCollection
      SET verificationMessage = $1, paymentType = 'O', paymentOn = CURRENT_TIMESTAMP, paymentStatus = 'V'
      WHERE tenantRentNoticeID = $2;
    `;
    await db.query(updateManagerCollectionQuery, [
      verificationMessage,
      rentNoticeID,
    ]);

    // Send notification to owner
    const notificationMessage = `Manager is requesting online rent verification for property ${propertyAddress}.`;
    const notificationQuery = `
    INSERT INTO UserNotification (userID, userType, senderID, senderType, notificationText, notificationType)
    VALUES ($1, 'O', $2, 'M', $3, 'R');
  `;
    await db.query(notificationQuery, [
      ownerID,
      managerID,
      notificationMessage,
    ]);

    return res.status(200).json({
      success: "Online verification request submitted successfully.",
    });
  } catch (error) {
    console.error(
      "Error submitting online verification request by manager:",
      error
    );
    return res.status(500).json({
      success: "Failed to submit online verification request by manager.",
    });
  }
};

// API 4: Pending Rents List
export const pendingRentsList = async (req, res) => {
  try {
    const { managerID } = req.body;

    // Get current month and year
    const currentDate = new Date();
    const currentMonth = ("0" + (currentDate.getMonth() + 1)).slice(-2);
    const currentYear = currentDate.getFullYear().toString();

    // Query to fetch properties managed by the manager
    const managedPropertiesQuery = `
      SELECT id
      FROM Property
      WHERE managerID = $1
        AND propertyStatus = 'L'; -- Only active properties
    `;
    const managedPropertiesResult = await db.query(managedPropertiesQuery, [
      managerID,
    ]);

    // Extract property IDs
    const propertyIDs = managedPropertiesResult.rows.map((row) => row.id);

    // Query to fetch pending rents for manager's properties
    const pendingRentsQuery = `
      SELECT
          trn.propertyID as id,
          trn.rentAmount,
          TO_CHAR(trn.createdOn, 'DD-MM-YYYY') as createdOn,
          ui.firstName || ' ' || ui.lastName as tenantName,
          prop.propertyAddress || ', ' || area.areaName || ', ' || city.cityName as propertyAddress
      FROM 
          TenantRentNotice trn
      JOIN 
          Property prop ON trn.propertyID = prop.id
      JOIN 
          UserInformation ui ON trn.tenantID = ui.id
      JOIN 
          Area area ON prop.areaID = area.id
      JOIN 
          City city ON area.cityID = city.id
      WHERE 
          prop.id IN (${propertyIDs.join(",")})
          AND trn.tenantID IS NOT NULL
          AND (trn.paymentStatus = 'P' 
            OR trn.paymentStatus = 'T' 
            OR trn.paymentStatus = 'V')
          AND DATE_PART('month', trn.createdOn) = $1
          AND DATE_PART('year', trn.createdOn) = $2
      ORDER BY trn.id DESC;
    `;

    // Execute query for pending rents
    const pendingRentsResult = await db.query(pendingRentsQuery, [
      currentMonth,
      currentYear,
    ]);

    // Send pending rents as response
    return res.status(200).json({
      pendingRents: pendingRentsResult.rows,
    });
  } catch (error) {
    console.error("Error fetching pending rents for manager:", error);
    return res.status(500).json({
      error: "Failed to fetch pending rents for manager.",
      message: error.message,
    });
  }
};

// API 5: Paid Rents List
export const paidRentsList = async (req, res) => {
  try {
    const { managerID } = req.body;

    // Get current month and year
    const currentDate = new Date();
    const currentMonth = ("0" + (currentDate.getMonth() + 1)).slice(-2);
    const currentYear = currentDate.getFullYear().toString();

    // Query to fetch properties managed by the manager
    const managedPropertiesQuery = `
      SELECT id
      FROM Property
      WHERE managerID = $1
        AND propertyStatus = 'L'; -- Only active properties
    `;
    const managedPropertiesResult = await db.query(managedPropertiesQuery, [
      managerID,
    ]);

    // Extract property IDs
    const propertyIDs = managedPropertiesResult.rows.map((row) => row.id);

    // Query to fetch paid rents for manager's properties
    const paidRentsQuery = `
      SELECT
          trn.propertyID as id,
          trn.rentAmount,
          TO_CHAR(trn.createdOn, 'DD-MM-YYYY') as createdOn,
          ui.firstName || ' ' || ui.lastName as tenantName,
          prop.propertyAddress || ', ' || area.areaName || ', ' || city.cityName as propertyAddress
      FROM 
          TenantRentNotice trn
      JOIN 
          Property prop ON trn.propertyID = prop.id
      JOIN 
          UserInformation ui ON trn.tenantID = ui.id
      JOIN 
          Area area ON prop.areaID = area.id
      JOIN 
          City city ON area.cityID = city.id
      WHERE 
          prop.id IN (${propertyIDs.join(",")})
          AND trn.tenantID IS NOT NULL
          AND trn.paymentStatus = 'C'
          AND DATE_PART('month', trn.createdOn) = $1
          AND DATE_PART('year', trn.createdOn) = $2
      ORDER BY trn.id DESC;
    `;

    // Execute query for paid rents
    const paidRentsResult = await db.query(paidRentsQuery, [
      currentMonth,
      currentYear,
    ]);

    // Send paid rents as response
    return res.status(200).json({
      paidRents: paidRentsResult.rows,
    });
  } catch (error) {
    console.error("Error fetching paid rents for manager:", error);
    return res.status(500).json({
      error: "Failed to fetch paid rents for manager.",
      message: error.message,
    });
  }
};
