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

    const amountSubmittedToOwner = collectedAmount - managersCut;

    // Update TenantRentNotice table
    const updateRentNoticeQuery = `
        UPDATE TenantRentNotice
        SET paymentStatus = 'C',
        submittedRent = $1
        WHERE id = $2;
      `;
    await db.query(updateRentNoticeQuery, [collectedAmount, rentNoticeID]);

    // Create ManagerRentCollection entry
    const createCollectionQuery = `
        INSERT INTO ManagerRentCollection (tenantRentNoticeID, managerID, collectedAmount, managersCut, amountSubmittedToOwner, paymentStatus)
        VALUES ($1, $2, $3, $4, $5, 'P');
      `;
    await db.query(createCollectionQuery, [
      rentNoticeID,
      managerID,
      collectedAmount,
      managersCut,
      amountSubmittedToOwner,
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

    const amountSubmittedToOwner = collectedAmount - managersCut;

    // Create ManagerRentCollection entry
    const createCollectionQuery = `
    INSERT INTO ManagerRentCollection (tenantRentNoticeID, managerID, collectedAmount, managersCut, amountSubmittedToOwner, paymentStatus)
    VALUES ($1, $2, $3, $4, $5, 'P');
      `;
    await db.query(createCollectionQuery, [
      rentNoticeID,
      managerID,
      collectedAmount,
      managersCut,
      amountSubmittedToOwner,
    ]);

    // Update TenantRentNotice table
    const updateRentNoticeQuery = `
        UPDATE TenantRentNotice
        SET paymentStatus = 'C', paymentOn = CURRENT_TIMESTAMP,
        submittedRent = $1
        WHERE id = $2;
      `;
    await db.query(updateRentNoticeQuery, [collectedAmount, rentNoticeID]);

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
    console.log(rentNoticeID);

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

    console.log(checkRequestResult.rows);
    console.log(checkRequestResult.rows.length);

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
