import db from "../../config/config.js";

// API 1: Submit Online Verification Request
export const submitVerificationRequest = async (req, res) => {
  try {
    const { tenantID, propertyID, verificationMessage } = req.body;

    // Check if there is a manager for the property
    const managerIDQuery = `
        SELECT managerID
        FROM Property
        WHERE id = $1;
      `;
    const managerIDResult = await db.query(managerIDQuery, [propertyID]);
    const managerID = managerIDResult.rows[0].managerid;

    // Find ownerID
    const ownerIDQuery = `
        SELECT ownerID
        FROM Property
        WHERE id = $1;
      `;
    const ownerIDResult = await db.query(ownerIDQuery, [propertyID]);
    const ownerID = ownerIDResult.rows[0].ownerid;

    // Send notification to owner or manager
    let receiverID;
    let receiverType;
    let notificationMessage;

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

    if (managerID) {
      receiverID = managerID;
      receiverType = "M";
      notificationMessage = `Tenant is requesting online rent verification for property ${propertyAddress}.`;
    } else {
      receiverID = ownerID;
      receiverType = "O";
      notificationMessage = `Tenant is requesting online rent verification for property ${propertyAddress}.`;
    }

    // Find last TenantRentNotice for the tenant
    const lastRentNoticeQuery = `
        SELECT id
        FROM TenantRentNotice
        WHERE tenantID = $1 AND EXTRACT(MONTH FROM createdOn) = EXTRACT(MONTH FROM CURRENT_TIMESTAMP)
        AND EXTRACT(YEAR FROM createdOn) = EXTRACT(YEAR FROM CURRENT_TIMESTAMP) AND paymentStatus = 'P'
        ORDER BY createdOn DESC
        LIMIT 1;
      `;
    const lastRentNoticeResult = await db.query(lastRentNoticeQuery, [
      tenantID,
    ]);

    //Check for rows
    if (lastRentNoticeResult.rows.length === 0) {
      return res
        .status(400)
        .json({ success: "Cannot send verification request" });
    }

    const lastRentNoticeID = lastRentNoticeResult.rows[0].id;

    // Update TenantRentNotice table
    const updateRentNoticeQuery = `
        UPDATE TenantRentNotice
        SET paymentType = 'O', verificationMessage = $1, paymentStatus = 'V', paymentOn = CURRENT_TIMESTAMP
        WHERE id = $2;
      `;
    await db.query(updateRentNoticeQuery, [
      verificationMessage,
      lastRentNoticeID,
    ]);

    const notificationQuery = `
        INSERT INTO UserNotification (userID, userType, senderID, senderType, notificationText, notificationType)
        VALUES ($1, $2, $3, $4, $5, 'R');
    `;
    await db.query(notificationQuery, [
      receiverID,
      receiverType,
      tenantID,
      "T",
      notificationMessage,
    ]);

    return res.status(200).json({
      success: true,
      message: "Online verification request submitted successfully.",
    });
  } catch (error) {
    console.error("Error submitting online verification request:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit online verification request.",
    });
  }
};

// API 2: Submit Collection Request
export const submitCollectionRequest = async (req, res) => {
  try {
    const { tenantID, propertyID } = req.body;

    // Check if there is a manager for the property
    const managerIDQuery = `
          SELECT managerID
          FROM Property
          WHERE id = $1;
        `;
    const managerIDResult = await db.query(managerIDQuery, [propertyID]);
    const managerID = managerIDResult.rows[0].managerid;

    // Find ownerID
    const ownerIDQuery = `
          SELECT ownerID
          FROM Property
          WHERE id = $1;
        `;
    const ownerIDResult = await db.query(ownerIDQuery, [propertyID]);
    const ownerID = ownerIDResult.rows[0].ownerid;

    // Send notification to owner or manager
    let receiverID;
    let receiverType;
    let notificationMessage;

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

    if (managerID) {
      receiverID = managerID;
      receiverType = "M";
      notificationMessage = `Tenant is requesting rent collection for property ${propertyAddress}.`;
    } else {
      receiverID = ownerID;
      receiverType = "O";
      notificationMessage = `Tenant is requesting rent collection for property ${propertyAddress}.`;
    }

    // Find last TenantRentNotice for the tenant
    const lastRentNoticeQuery = `
          SELECT id
          FROM TenantRentNotice
          WHERE tenantID = $1 AND EXTRACT(MONTH FROM createdOn) = EXTRACT(MONTH FROM CURRENT_TIMESTAMP)
          AND EXTRACT(YEAR FROM createdOn) = EXTRACT(YEAR FROM CURRENT_TIMESTAMP) AND paymentStatus = 'P'
          ORDER BY createdOn DESC
          LIMIT 1;
        `;
    const lastRentNoticeResult = await db.query(lastRentNoticeQuery, [
      tenantID,
    ]);
    //Check for rows
    if (lastRentNoticeResult.rows.length === 0) {
      return res
        .status(400)
        .json({ success: "Cannot send collection request." });
    }
    const lastRentNoticeID = lastRentNoticeResult.rows[0].id;

    // Update TenantRentNotice table
    const updateRentNoticeQuery = `
        UPDATE TenantRentNotice
        SET paymentType = 'C', paymentStatus = 'T', requestedCollectionOn = CURRENT_TIMESTAMP
        WHERE id = $1;
    `;
    await db.query(updateRentNoticeQuery, [lastRentNoticeID]);

    const notificationQuery = `
          INSERT INTO UserNotification (userID, userType, senderID, senderType, notificationText, notificationType)
          VALUES ($1, $2, $3, $4, $5, 'R');
      `;
    await db.query(notificationQuery, [
      receiverID,
      receiverType,
      tenantID,
      "T",
      notificationMessage,
    ]);

    return res.status(200).json({
      success: true,
      message: "Rent collection request submitted successfully.",
    });
  } catch (error) {
    console.error("Error submitting online verification request:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit online verification request.",
    });
  }
};
