import db from "../../config/config.js";

//API 1: Verify Online Rent
export const verifyOnlineRent = async (req, res) => {
  try {
    const { ownerID, propertyID, collectedAmount } = req.body;

    // Check if property is managed
    const propertyQuery = `
        SELECT managerID, tenantID
        FROM Property
        WHERE id = $1;
      `;
    const propertyResult = await db.query(propertyQuery, [propertyID]);
    const { managerid: managerID, tenantid: tenantID } = propertyResult.rows[0];

    if (managerID) {
      // If property is managed, verify rent with manager
      const rentNoticeQuery = `
          SELECT id
          FROM TenantRentNotice
          WHERE tenantID = $1 AND EXTRACT(MONTH FROM createdOn) = EXTRACT(MONTH FROM CURRENT_TIMESTAMP)
          AND EXTRACT(YEAR FROM createdOn) = EXTRACT(YEAR FROM CURRENT_TIMESTAMP)
          AND paymentStatus = 'C' AND propertyID = $2
          ORDER BY createdOn DESC
          LIMIT 1;
        `;
      const rentNoticeResult = await db.query(rentNoticeQuery, [
        tenantID,
        propertyID,
      ]);

      if (rentNoticeResult.rows.length === 0) {
        return res.status(400).json({ success: "No rent to verify." });
      }

      const rentNoticeID = rentNoticeResult.rows[0].id;

      // Check if rent has already been verified
      const checkCollectionQuery = `
          SELECT paymentStatus
          FROM ManagerRentCollection
          WHERE tenantRentNoticeID = $1
          AND paymentStatus = 'C';
        `;
      const checkCollectionResult = await db.query(checkCollectionQuery, [
        rentNoticeID,
      ]);

      if (checkCollectionResult.rows.length > 0) {
        return res
          .status(400)
          .json({ success: "Rent has already been verified." });
      }

      // Update ManagerRentCollection
      const updateCollectionQuery = `
          UPDATE ManagerRentCollection
          SET paymentStatus = 'C', amountSubmittedToOwner = $1
          WHERE tenantRentNoticeID = $2;
        `;
      await db.query(updateCollectionQuery, [collectedAmount, rentNoticeID]);

      // Create OwnerRentTransaction
      const createTransactionQuery = `
          INSERT INTO OwnerRentTransaction (propertyID, tenantRentNoticeID, collectedAmount)
          VALUES ($1, $2, $3);
        `;
      await db.query(createTransactionQuery, [
        propertyID,
        rentNoticeID,
        collectedAmount,
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

      // Send notifications
      const notificationMessage = `Rent for property ${propertyAddress} has been verified online.`;
      const notificationType = "R";

      const notificationQuery = `
          INSERT INTO UserNotification (userID, userType, senderID, senderType, notificationText, notificationType)
          VALUES ($1, $2, $3, $4, $5, $6);
      `;
      await db.query(notificationQuery, [
        managerID,
        "M",
        ownerID,
        "O",
        notificationMessage,
        notificationType,
      ]);

      return res
        .status(200)
        .json({ success: "Online rent verified successfully." });
    } else {
      // If property is not managed, verify rent directly
      const rentNoticeQuery = `
          SELECT id, paymentStatus
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

      if (rentNoticeResult.rows.length === 0) {
        return res.status(400).json({ success: "Error in verifying rent." });
      }

      const rentNoticeID = rentNoticeResult.rows[0].id;

      // Update TenantRentNotice
      const updateRentNoticeQuery = `
          UPDATE TenantRentNotice
          SET paymentStatus = 'C',
          submittedAmount = $1
          WHERE id = $2;
        `;
      await db.query(updateRentNoticeQuery, [collectedAmount, rentNoticeID]);

      // Create OwnerRentTransaction
      const createTransactionQuery = `
          INSERT INTO OwnerRentTransaction (propertyID, tenantRentNoticeID, collectedAmount)
          VALUES ($1, $2, $3);
        `;
      await db.query(createTransactionQuery, [
        propertyID,
        rentNoticeID,
        collectedAmount,
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

      // Send notifications
      const notificationMessage = `Rent for property ${propertyAddress} has been verified online.`;
      const notificationType = "R";

      const notificationQuery = `
          INSERT INTO UserNotification (userID, userType, senderID, senderType, notificationText, notificationType)
          VALUES ($1, $2, $3, $4, $5, $6);
      `;
      await db.query(notificationQuery, [
        tenantID,
        "T",
        ownerID,
        "O",
        notificationMessage,
        notificationType,
      ]);

      return res
        .status(200)
        .json({ success: "Online rent verified successfully." });
    }
  } catch (error) {
    console.error("Error verifying online rent:", error);
    return res.status(500).json({ error: "Failed to verify online rent." });
  }
};

//API 2: Collect Rent
export const collectRent = async (req, res) => {
  try {
    const { ownerID, propertyID, collectedAmount } = req.body;

    // Check if property is managed
    const propertyQuery = `
        SELECT managerID, tenantID
        FROM Property
        WHERE id = $1;
      `;
    const propertyResult = await db.query(propertyQuery, [propertyID]);
    const { managerid: managerID, tenantid: tenantID } = propertyResult.rows[0];

    if (managerID) {
      // If property is managed, collect rent with manager
      const rentNoticeQuery = `
          SELECT id
          FROM TenantRentNotice
          WHERE tenantID = $1 AND EXTRACT(MONTH FROM createdOn) = EXTRACT(MONTH FROM CURRENT_TIMESTAMP)
          AND EXTRACT(YEAR FROM createdOn) = EXTRACT(YEAR FROM CURRENT_TIMESTAMP)
          AND paymentStatus = 'C' AND propertyID = $2
          ORDER BY createdOn DESC
          LIMIT 1;
        `;
      const rentNoticeResult = await db.query(rentNoticeQuery, [
        tenantID,
        propertyID,
      ]);

      const rentNoticeID = rentNoticeResult.rows[0].id;

      // Check if rent has already been verified
      const checkCollectionQuery = `
        SELECT paymentStatus
        FROM ManagerRentCollection
        WHERE tenantRentNoticeID = $1
        AND paymentStatus = 'C';
      `;
      const checkCollectionResult = await db.query(checkCollectionQuery, [
        rentNoticeID,
      ]);

      if (checkCollectionResult.rows.length > 0) {
        return res
          .status(400)
          .json({ success: "Rent has already been collected." });
      }

      // Update ManagerRentCollection
      const updateCollectionQuery = `
        UPDATE ManagerRentCollection
        SET paymentStatus = 'C', paymentType = 'C', 
        paymentOn = CURRENT_TIMESTAMP, amountSubmittedToOwner = $1
        WHERE tenantRentNoticeID = $2;
      `;
      await db.query(updateCollectionQuery, [collectedAmount, rentNoticeID]);

      // Create OwnerRentTransaction
      const createTransactionQuery = `
          INSERT INTO OwnerRentTransaction (propertyID, tenantRentNoticeID, collectedAmount)
          VALUES ($1, $2, $3);
        `;
      await db.query(createTransactionQuery, [
        propertyID,
        rentNoticeID,
        collectedAmount,
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

      // Send notifications
      const notificationMessage = `Rent for property ${propertyAddress} has been collected.`;
      const notificationType = "R";

      const notificationQuery = `
          INSERT INTO UserNotification (userID, userType, senderID, senderType, notificationText, notificationType)
          VALUES ($1, $2, $3, $4, $5, $6);
      `;
      await db.query(notificationQuery, [
        managerID,
        "M",
        ownerID,
        "O",
        notificationMessage,
        notificationType,
      ]);

      return res.status(200).json({ success: "Rent collected successfully." });
    } else {
      // If property is not managed, collect rent directly
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
        return res.status(400).json({ success: "Error in collecting rent" });
      }

      const rentNoticeID = rentNoticeResult.rows[0].id;

      // Update TenantRentNotice
      const updateRentNoticeQuery = `
          UPDATE TenantRentNotice
          SET paymentStatus = 'C', paymentOn = CURRENT_TIMESTAMP,
          submittedAmount = $1
          WHERE id = $2;
        `;
      await db.query(updateRentNoticeQuery, [collectedAmount, rentNoticeID]);

      // Create OwnerRentTransaction
      const createTransactionQuery = `
          INSERT INTO OwnerRentTransaction (propertyID, tenantRentNoticeID, collectedAmount)
          VALUES ($1, $2, $3);
        `;
      await db.query(createTransactionQuery, [
        propertyID,
        rentNoticeID,
        collectedAmount,
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

      // Send notifications
      const notificationMessage = `Rent for property ${propertyAddress} has been collected.`;
      const notificationType = "R";

      const notificationQuery = `
          INSERT INTO UserNotification (userID, userType, senderID, senderType, notificationText, notificationType)
          VALUES ($1, $2, $3, $4, $5, $6);
      `;
      await db.query(notificationQuery, [
        tenantID,
        "T",
        ownerID,
        "O",
        notificationMessage,
        notificationType,
      ]);

      return res.status(200).json({ success: "Rent collected successfully." });
    }
  } catch (error) {
    console.error("Error collecting rent:", error);
    return res.status(500).json({ error: "Failed to collect rent." });
  }
};
