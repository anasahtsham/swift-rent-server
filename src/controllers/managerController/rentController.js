import db from "../../config/config.js";

//API 1: Verify Online Rent
export const verifyOnlineRent = async (req, res) => {
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

    // Find the latest TenantRentNotice with paymentStatus 'V'
    const rentNoticeQuery = `
        SELECT id
        FROM TenantRentNotice
        WHERE tenantID = $1 AND EXTRACT(MONTH FROM createdOn) = EXTRACT(MONTH FROM CURRENT_TIMESTAMP)
        AND EXTRACT(YEAR FROM createdOn) = EXTRACT(YEAR FROM CURRENT_TIMESTAMP)
        AND paymentStatus = 'V'
        ORDER BY createdOn DESC
        LIMIT 1;
      `;
    const rentNoticeResult = await db.query(rentNoticeQuery, [tenantID]);

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
        SET paymentStatus = 'C'
        WHERE id = $1;
      `;
    await db.query(updateRentNoticeQuery, [rentNoticeID]);

    // Create ManagerRentCollection entry
    const createCollectionQuery = `
        INSERT INTO ManagerRentCollection (tenantRentNoticeID, managerID, collectedAmount, managersCut, amountSubmittedToOwner, paymentType, paymentOn, paymentStatus)
        VALUES ($1, $2, $3, $4, $5, 'O', CURRENT_TIMESTAMP, 'P');
      `;
    await db.query(createCollectionQuery, [
      rentNoticeID,
      managerID,
      collectedAmount,
      managersCut,
      amountSubmittedToOwner,
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
        AND paymentStatus = 'T'
        ORDER BY createdOn DESC
        LIMIT 1;
      `;
    const rentNoticeResult = await db.query(rentNoticeQuery, [tenantID]);

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
        INSERT INTO ManagerRentCollection (tenantRentNoticeID, managerID, collectedAmount, managersCut, amountSubmittedToOwner, paymentType, paymentOn, paymentStatus)
        VALUES ($1, $2, $3, $4, $5, 'C', CURRENT_TIMESTAMP, 'P');
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
        SET paymentStatus = 'C', paymentOn = CURRENT_TIMESTAMP
        WHERE id = $1;
      `;
    await db.query(updateRentNoticeQuery, [rentNoticeID]);

    return res.status(200).json({ success: "Rent collected successfully." });
  } catch (error) {
    console.error("Error collecting rent:", error);
    return res.status(500).json({ success: "Failed to collect rent." });
  }
};
