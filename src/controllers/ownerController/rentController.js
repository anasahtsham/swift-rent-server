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
          AND paymentStatus = 'C'
          ORDER BY createdOn DESC
          LIMIT 1;
        `;
      const rentNoticeResult = await db.query(rentNoticeQuery, [tenantID]);

      if (rentNoticeResult.rows.length === 0) {
        return res.status(400).json({ error: "No rent to verify." });
      }

      const rentNoticeID = rentNoticeResult.rows[0].id;

      // Update ManagerRentCollection
      const updateCollectionQuery = `
          UPDATE ManagerRentCollection
          SET paymentStatus = 'C'
          WHERE tenantRentNoticeID = $1;
        `;
      await db.query(updateCollectionQuery, [rentNoticeID]);

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

      // Send notifications
      //   const ownerNotificationText = `Rent for your property has been verified online.`;
      //   await sendNotification(ownerID, "O", ownerNotificationText, "R");

      return res
        .status(200)
        .json({ success: "Online rent verified successfully." });
    } else {
      // If property is not managed, verify rent directly
      const rentNoticeQuery = `
          SELECT id
          FROM TenantRentNotice
          WHERE tenantID = $1 AND EXTRACT(MONTH FROM createdOn) = EXTRACT(MONTH FROM CURRENT_TIMESTAMP)
          AND EXTRACT(YEAR FROM createdOn) = EXTRACT(YEAR FROM CURRENT_TIMESTAMP)
          AND paymentStatus = 'C'
          ORDER BY createdOn DESC
          LIMIT 1;
        `;
      const rentNoticeResult = await db.query(rentNoticeQuery, [tenantID]);

      if (rentNoticeResult.rows.length === 0) {
        return res.status(400).json({ error: "No rent to verify." });
      }

      const rentNoticeID = rentNoticeResult.rows[0].id;

      // Update TenantRentNotice
      const updateRentNoticeQuery = `
          UPDATE TenantRentNotice
          SET paymentStatus = 'C', paymentOn = CURRENT_TIMESTAMP
          WHERE id = $1;
        `;
      await db.query(updateRentNoticeQuery, [rentNoticeID]);

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

      // Send notifications
      //   const ownerNotificationText = `Rent for your property has been verified online.`;
      //   await sendNotification(ownerID, "O", ownerNotificationText, "R");

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
          AND paymentStatus = 'C'
          ORDER BY createdOn DESC
          LIMIT 1;
        `;
      const rentNoticeResult = await db.query(rentNoticeQuery, [tenantID]);

      if (rentNoticeResult.rows.length === 0) {
        return res.status(400).json({ error: "No rent to collect." });
      }

      const rentNoticeID = rentNoticeResult.rows[0].id;

      // Update ManagerRentCollection
      const updateCollectionQuery = `
          UPDATE ManagerRentCollection
          SET paymentStatus = 'C', paymentType = 'C', paymentOn = CURRENT_TIMESTAMP
          WHERE tenantRentNoticeID = $1;
        `;
      await db.query(updateCollectionQuery, [rentNoticeID]);

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

      // Send notifications
      const ownerNotificationText = `Rent for your property has been collected.`;
      await sendNotification(ownerID, "O", ownerNotificationText, "R");

      return res.status(200).json({ success: "Rent collected successfully." });
    } else {
      // If property is not managed, collect rent directly
      const rentNoticeQuery = `
          SELECT id
          FROM TenantRentNotice
          WHERE tenantID = $1 AND EXTRACT(MONTH FROM createdOn) = EXTRACT(MONTH FROM CURRENT_TIMESTAMP)
          AND EXTRACT(YEAR FROM createdOn) = EXTRACT(YEAR FROM CURRENT_TIMESTAMP)
          AND paymentStatus = 'T'
          ORDER BY createdOn DESC
          LIMIT 1;
        `;
      const rentNoticeResult = await db.query(rentNoticeQuery, [tenantID]);

      if (rentNoticeResult.rows.length === 0) {
        return res.status(400).json({ error: "No rent to collect." });
      }

      const rentNoticeID = rentNoticeResult.rows[0].id;

      // Update TenantRentNotice
      const updateRentNoticeQuery = `
          UPDATE TenantRentNotice
          SET paymentStatus = 'C', paymentOn = CURRENT_TIMESTAMP
          WHERE id = $1;
        `;
      await db.query(updateRentNoticeQuery, [rentNoticeID]);

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

      // Send notifications
      const ownerNotificationText = `Rent for your property has been collected.`;
      await sendNotification(ownerID, "O", ownerNotificationText, "R");

      return res.status(200).json({ success: "Rent collected successfully." });
    }
  } catch (error) {
    console.error("Error collecting rent:", error);
    return res.status(500).json({ error: "Failed to collect rent." });
  }
};
