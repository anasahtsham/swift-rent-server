import db from "../../config/config.js";

// API 1: Generate Hiring Request
export const generateHiringRequest = async (req, res) => {
  try {
    // Extract inputs from the request body
    const {
      propertyID,
      purpose,
      oneTimePay,
      salaryPaymentType,
      salaryFixed,
      salaryPercentage,
      whoBringsTenant,
      rent,
      specialCondition,
      needHelpWithLegalWork,
    } = req.body;

    // Check if property exists
    const propertyQuery = `SELECT * FROM Property WHERE id = $1`;
    const property = await db.query(propertyQuery, [propertyID]);

    if (property.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Property does not exist.",
      });
    }

    // Check if managerHireRequest exists with the same propertyID and status 'A' or 'P'
    const hireRequestQuery = `SELECT * FROM ManagerHireRequest WHERE propertyID = $1 AND managerStatus IN ('A', 'P')`;
    const hireRequest = await db.query(hireRequestQuery, [propertyID]);

    if (hireRequest.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Hiring request already exists for this property.",
      });
    }

    // Insert hiring request into the ManagerHireRequest table
    const insertQuery = `
      INSERT INTO ManagerHireRequest (
        propertyID, 
        purpose, 
        oneTimePay, 
        salaryPaymentType, 
        salaryFixed, 
        salaryPercentage, 
        whoBringsTenant, 
        rent, specialCondition, 
        needHelpWithLegalWork, 
        managerStatus)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'P')
    `;
    await db.query(insertQuery, [
      propertyID,
      purpose,
      oneTimePay,
      salaryPaymentType,
      salaryFixed,
      salaryPercentage,
      whoBringsTenant,
      rent,
      specialCondition,
      needHelpWithLegalWork,
    ]);

    // Send success response
    res.status(200).json({
      success: "Hiring request generated successfully.",
    });
  } catch (error) {
    console.error("Error generating hiring request:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to generate hiring request." });
  }
};

// API 2: Display Counter Offers
export const viewManagerHireCounterRequests = async (req, res) => {
  try {
    // Extract propertyID from request parameters
    const { propertyID } = req.body;

    // Check in the Property table is managerID exists
    const propertyQuery = `SELECT managerID FROM Property WHERE id = $1`;
    const property = await db.query(propertyQuery, [propertyID]);

    // If managerID is null then return error
    if (property.rows[0].managerid != null) {
      return res.status(400).json({
        success: "Manager is already assigned to this property.",
      });
    }

    // Query to fetch manager hire counter requests
    const query = `
      SELECT MHC.id,
             CONCAT(UI.firstName, ' ', UI.lastName) AS "managerName",
             UI.id as managerID,
             MHC.oneTimePay,
             MHC.salaryFixed,
             MHC.salaryPercentage,
             MHC.rent,
             MHC.counterRequestStatus,
             TO_CHAR(MHC.counterRequestOn, 'DD-MM-YYYY HH24:MI') AS "counterRequestOn"
      FROM ManagerHireRequest MHR
      JOIN ManagerHireCounterRequest MHC ON MHR.id = MHC.managerHireRequestID
      JOIN UserInformation UI ON MHC.managerID = UI.id
      JOIN Property P ON MHR.propertyID = P.id
      JOIN Area A ON P.areaID = A.id
      JOIN City C ON A.cityID = C.id
      WHERE P.id = $1 AND MHR.managerStatus = 'P' AND MHC.counterRequestStatus != 'R' AND MHC.counterRequestStatus != 'A';
    `;
    const counterRequests = await db.query(query, [propertyID]);

    // Fetch owner demands from ManagerHireRequest table
    const ownerDemandsQuery = `
      SELECT purpose, oneTimePay, salaryPaymentType, salaryFixed, salaryPercentage, whoBringsTenant, rent, specialCondition, needHelpWithLegalWork
      FROM ManagerHireRequest
      WHERE propertyID = $1 AND managerStatus = 'P'
      LIMIT 1;
    `;
    const ownerDemands = await db.query(ownerDemandsQuery, [propertyID]);

    // Send the list of manager hire counter requests along with owner demands as response
    res.status(200).json({
      ownerDemands: ownerDemands.rows[0], // Assuming there's only one owner demand
      managerHireCounterRequests: counterRequests.rows,
    });
  } catch (error) {
    console.error("Error viewing manager hire counter requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to view manager hire counter requests.",
    });
  }
};

//API 3: Reject Manager Hire Counter Request
export const rejectCounterRequest = async (req, res) => {
  try {
    // Extract managerCounterRequestID from request parameters
    const { managerCounterRequestID } = req.body;

    // Check if counter request is already rejected
    const statusQuery = `SELECT counterRequestStatus FROM ManagerHireCounterRequest WHERE id = $1;`;
    const status = await db.query(statusQuery, [managerCounterRequestID]);

    // Check if counter request exists
    if (status.rows.length === 0) {
      return res.status(400).json({
        success: "Counter request does not exist.",
      });
    }

    if (status.rows[0].counterrequeststatus === "R") {
      return res.status(400).json({
        success: "Counter request is already rejected.",
      });
    }
    // Check if counter request is already accepted
    if (status.rows[0].counterrequeststatus === "A") {
      return res.status(400).json({
        success: false,
        message: "Counter request is already accepted.",
      });
    }

    //Find the owner id from UserInformation table
    const ownerQuery = `SELECT ui.id
    FROM ManagerHireCounterRequest m
    JOIN ManagerHireRequest mr ON m.managerHireRequestID = mr.id
    JOIN Property p ON mr.propertyID = p.id
    JOIN UserInformation ui ON p.ownerID = ui.id
    WHERE m.id = $1;`;
    const ownerID = await db.query(ownerQuery, [managerCounterRequestID]);

    // Get the property address using the ManagerHireCounterRequestID
    const propertyQuery = `
    SELECT
    CONCAT(P.propertyAddress, ', ', A.areaName, ', ', C.cityName) AS address
    FROM Property P
    JOIN Area A ON P.areaID = A.id
    JOIN City C ON A.cityID = C.id
    WHERE P.id = (SELECT propertyID FROM ManagerHireRequest WHERE id = (
      SELECT managerHireRequestID FROM ManagerHireCounterRequest WHERE id = $1
    ));
    `;
    const propertyAddress = await db.query(propertyQuery, [
      managerCounterRequestID,
    ]);

    // Get the complete property address (address + area + city)

    // Send notification to the manager
    const managerNotificationQuery = `
      INSERT INTO UserNotification (userID, userType, senderID, senderType, notificationText, notificationType)
      SELECT 
      managerID, 'M', 
      $1, 'O', 
      'The owner has rejected your counter request for property ${propertyAddress.rows[0].address}. You can send him another request if you want to.', 
      'R'
      FROM ManagerHireCounterRequest
      WHERE id = $2;
    `;
    await db.query(managerNotificationQuery, [
      ownerID.rows[0].id,
      managerCounterRequestID,
    ]);

    //Update status of the counter request to 'R' (Rejected)
    const updateQuery = `UPDATE ManagerHireCounterRequest SET counterRequestStatus = 'R' WHERE id = $1;`;
    await db.query(updateQuery, [managerCounterRequestID]);

    // Send success response
    res.status(200).json({
      success: "Counter request rejected and notification sent to the manager.",
    });
  } catch (error) {
    console.error("Error during reject counter request:", error);
    res.status(500).json({
      success: false,
      message:
        "Failed to reject counter request and send notification to the manager.",
    });
  }
};

//API 4: Invite Manager for Interview
export const inviteManagerForInterview = async (req, res) => {
  try {
    // Extract managerCounterRequestID from request parameters
    const { managerCounterRequestID } = req.body;

    // Check if counter request is already rejected
    const statusQuery = `SELECT counterRequestStatus FROM ManagerHireCounterRequest WHERE id = $1;`;
    const status = await db.query(statusQuery, [managerCounterRequestID]);

    if (status.rows.length === 0) {
      return res.status(400).json({
        success: "Counter request does not exist.",
      });
    }

    if (status.rows[0].counterrequeststatus === "R") {
      return res.status(400).json({
        success: "Counter request is already rejected.",
      });
    }

    if (status.rows[0].counterrequeststatus === "A") {
      return res.status(400).json({
        success: "Counter request is already accepted.",
      });
    }

    if (status.rows[0].counterrequeststatus === "I") {
      return res.status(400).json({
        success: "Interview invitation is already sent.",
      });
    }

    // Find the owner id from UserInformation table
    const ownerQuery = `
      SELECT ui.id, ui.phone
      FROM ManagerHireCounterRequest m
      JOIN ManagerHireRequest mr ON m.managerHireRequestID = mr.id
      JOIN Property p ON mr.propertyID = p.id
      JOIN UserInformation ui ON p.ownerID = ui.id
      WHERE m.id = $1;
    `;
    const ownerIDResult = await db.query(ownerQuery, [managerCounterRequestID]);
    const ownerID = ownerIDResult.rows[0].id;
    const ownerPhone = ownerIDResult.rows[0].phone;

    // Get the property address using the ManagerHireCounterRequestID
    const propertyQuery = `
      SELECT CONCAT(P.propertyAddress, ', ', A.areaName, ', ', C.cityName) AS address
      FROM Property P
      JOIN Area A ON P.areaID = A.id
      JOIN City C ON A.cityID = C.id
      WHERE P.id = (
        SELECT propertyID FROM ManagerHireRequest WHERE id = (
          SELECT managerHireRequestID FROM ManagerHireCounterRequest WHERE id = $1
        )
      );
    `;
    const propertyAddressResult = await db.query(propertyQuery, [
      managerCounterRequestID,
    ]);
    const propertyAddress = propertyAddressResult.rows[0].address;

    // Send notification to the manager
    const managerNotificationQuery = `
      INSERT INTO UserNotification (userID, userType, senderID, senderType, notificationText, notificationType)
      SELECT managerID, 'M', 
      $1, 'O', 
      'The owner wants to interview you for the role of manager for property ${propertyAddress}. Owners phone number is ${ownerPhone}.', 
      'R'
      FROM ManagerHireCounterRequest
      WHERE id = $2;
    `;
    await db.query(managerNotificationQuery, [
      ownerID,
      managerCounterRequestID,
    ]);

    // Update status of the counter request to 'I' (Interview)
    const updateQuery = `
      UPDATE ManagerHireCounterRequest
      SET counterRequestStatus = 'I'
      WHERE id = $1;
    `;
    await db.query(updateQuery, [managerCounterRequestID]);

    // Send success response
    res.status(200).json({
      success: "Interview invitation sent successfully.",
    });
  } catch (error) {
    console.error("Error during interview invitation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send interview invitation.",
    });
  }
};

//API 5: Accept Manager Hire Counter Request
export const acceptCounterRequest = async (req, res) => {
  try {
    // Extract managerCounterRequestID from request parameters
    const { managerCounterRequestID } = req.body;

    const statusQuery = `SELECT counterRequestStatus FROM ManagerHireCounterRequest WHERE id = $1;`;
    const status = await db.query(statusQuery, [managerCounterRequestID]);

    if (status.rows.length === 0) {
      return res.status(400).json({
        success: "Counter request does not exist.",
      });
    }

    if (status.rows[0].counterrequeststatus === "R") {
      return res.status(400).json({
        success: "Counter request is already rejected.",
      });
    }

    if (status.rows[0].counterrequeststatus === "A") {
      return res.status(400).json({
        success: "Counter request is already accepted.",
      });
    }

    if (status.rows[0].counterrequeststatus === "P") {
      return res.status(400).json({
        success: "Interview invitation is still pending.",
      });
    }

    // Update the status of counterRequestStatus to 'A' (Accepted)
    const updateCounterRequestStatusQuery = `
      UPDATE ManagerHireCounterRequest
      SET counterRequestStatus = 'A'
      WHERE id = $1;
    `;
    await db.query(updateCounterRequestStatusQuery, [managerCounterRequestID]);

    // Get manager details and contract details
    const managerDetailsQuery = `
      SELECT 
        managerID, oneTimePay, salaryFixed, salaryPercentage, rent
      FROM ManagerHireCounterRequest
      WHERE id = $1;
    `;
    const managerDetailsResult = await db.query(managerDetailsQuery, [
      managerCounterRequestID,
    ]);
    const { managerid, onetimepay, salaryfixed, salarypercentage, rent } =
      managerDetailsResult.rows[0];

    // Update the status of managerStatus in ManagerHireRequest to 'A' (Active)
    const updateManagerHireRequestQuery = `
      UPDATE ManagerHireRequest
      SET managerStatus = 'A', 
      managerID = $1,
      oneTimePay = $2,
      salaryFixed = $3,
      salaryPercentage = $4,
      rent = $5,
      contractStartDate = CURRENT_DATE
      WHERE id = (
        SELECT managerHireRequestID
        FROM ManagerHireCounterRequest
        WHERE id = $6        
      );
    `;
    await db.query(updateManagerHireRequestQuery, [
      managerid,
      onetimepay,
      salaryfixed,
      salarypercentage,
      rent,
      managerCounterRequestID,
    ]);

    // Set the managerID in ManagerCounterRequest as the managerID in Property table
    const updatePropertyManagerIDQuery = `
      UPDATE Property
      SET managerID = $1
      WHERE id = (
        SELECT propertyID
        FROM ManagerHireRequest
        WHERE id = (
          SELECT managerHireRequestID
          FROM ManagerHireCounterRequest
          WHERE id = $2
        )
      );
    `;
    await db.query(updatePropertyManagerIDQuery, [
      managerid,
      managerCounterRequestID,
    ]);

    // Check if there is a tenantID in the property table
    const tenantQuery = `
      SELECT tenantID
      FROM Property
      WHERE id = (
        SELECT propertyID
        FROM ManagerHireRequest
        WHERE id = (
          SELECT managerHireRequestID
          FROM ManagerHireCounterRequest
          WHERE id = $1
        )
      );
    `;
    const tenantResult = await db.query(tenantQuery, [managerCounterRequestID]);

    // Find the owner id from UserInformation table
    const ownerQuery = `
        SELECT ui.id
        FROM ManagerHireCounterRequest m
        JOIN ManagerHireRequest mr ON m.managerHireRequestID = mr.id
        JOIN Property p ON mr.propertyID = p.id
        JOIN UserInformation ui ON p.ownerID = ui.id
        WHERE m.id = $1;
      `;
    const ownerIDResult = await db.query(ownerQuery, [managerCounterRequestID]);
    const ownerID = ownerIDResult.rows[0].id;

    // Get the property address using the ManagerHireCounterRequestID
    const propertyQuery = `
        SELECT CONCAT(P.propertyAddress, ', ', A.areaName, ', ', C.cityName) AS address
        FROM Property P
        JOIN Area A ON P.areaID = A.id
        JOIN City C ON A.cityID = C.id
        WHERE P.id = (
          SELECT propertyID FROM ManagerHireRequest WHERE id = (
            SELECT managerHireRequestID FROM ManagerHireCounterRequest WHERE id = $1
          )
        );
      `;
    const propertyAddressResult = await db.query(propertyQuery, [
      managerCounterRequestID,
    ]);
    const propertyAddress = propertyAddressResult.rows[0].address;

    if (tenantResult.rows[0].tenantid !== null) {
      const tenantID = tenantResult.rows[0].tenantid;

      // Get manager name
      const managerNameQuery = `
        SELECT CONCAT(firstName, ' ', lastName) AS managerName
        FROM UserInformation
        WHERE id = $1;
      `;
      const managerNameResult = await db.query(managerNameQuery, [managerid]);
      const managerName = managerNameResult.rows[0].managername;

      // Send a notification to the tenant
      const tenantNotificationQuery = `
        INSERT INTO UserNotification (userID, userType, senderID, senderType, notificationText, notificationType)
        VALUES (
          $1, 'T', 
          $2,'O', 
          'Your rental ${propertyAddress} is now managed by ${managerName}, he will be collecting your rents from now on.', 
          'R'
        );
      `;
      await db.query(tenantNotificationQuery, [tenantID, ownerID]);
    }

    // Send a notification to the manager
    const managerNotificationQuery = `
      INSERT INTO UserNotification (userID, userType, senderID, senderType, notificationText, notificationType)
      VALUES (
        $1, 'M', 
        $2, 'O', 
        'The owner has accepted your counter request for the property ${propertyAddress}. You are now responsible for collecting rents for the tenant.', 
        'R'
      );
    `;
    await db.query(managerNotificationQuery, [managerid, ownerID]);

    // Get PropertyID
    const propertyIDQuery = `
      SELECT propertyID, purpose
      FROM ManagerHireRequest
      WHERE id = (
        SELECT managerHireRequestID
        FROM ManagerHireCounterRequest
        WHERE id = $1
      );
    `;
    const propertyIDResult = await db.query(propertyIDQuery, [
      managerCounterRequestID,
    ]);
    const propertyID = propertyIDResult.rows[0].propertyid;
    const purpose = propertyIDResult.rows[0].purpose;

    //Get tenantID from Property table
    const tenantIDQuery = `
      SELECT tenantID
      FROM Property
      WHERE id = $1;
    `;
    const tenantIDResult = await db.query(tenantIDQuery, [propertyID]);
    const tenantID = tenantIDResult.rows[0].tenantid;
    const managerID = managerid;

    // Check the

    //Only Caretaking Manager
    if (purpose === "C") {
      // Create Rating Table for Owner to rate Manager
      const createOwnerManagerRatingQuery = `
        INSERT INTO Rating (propertyID, userID, userType, ratedByID, ratedByType, ratingStatus)
        VALUES ($1, $2, 'O', $3, 'M', 'P');
      `;
      await db.query(createOwnerManagerRatingQuery, [
        propertyID,
        ownerID,
        managerID,
      ]);

      // Create Rating Table for Manager to rate Owner
      const createManagerOwnerRatingQuery = `
        INSERT INTO Rating (propertyID, userID, userType, ratedByID, ratedByType, ratingStatus)
        VALUES ($1, $2, 'M', $3, 'O', 'P');
      `;
      await db.query(createManagerOwnerRatingQuery, [
        propertyID,
        managerID,
        ownerID,
      ]);
    }

    if (tenantID) {
      // Create Rating Table for Tenant to rate Manager
      const createTenantManagerRatingQuery = `
        INSERT INTO Rating (propertyID, userID, userType, ratedByID, ratedByType, ratingStatus)
        VALUES ($1, $2, 'T', $3, 'M', 'P');
      `;
      await db.query(createTenantManagerRatingQuery, [
        propertyID,
        tenantID,
        managerID,
      ]);

      // Create Rating Table for Manager to rate Tenant
      const createManagerTenantRatingQuery = `
        INSERT INTO Rating (propertyID, userID, userType, ratedByID, ratedByType, ratingStatus)
        VALUES ($1, $2, 'M', $3, 'T', 'P');
      `;
      await db.query(createManagerTenantRatingQuery, [
        propertyID,
        managerID,
        tenantID,
      ]);
    }

    // Send success response
    res.status(200).json({
      success: true,
      message: "Counter request accepted successfully.",
    });
  } catch (error) {
    console.error("Error during accepting counter request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to accept counter request.",
    });
  }
};

//API 6: Delete Manager Hire Request
export const deleteManagerHireRequest = async (req, res) => {
  try {
    // Extract propertyID from request body
    const { propertyID } = req.body;

    //Check if there is a managerID in the Property table
    const managerQuery = `SELECT managerID FROM Property WHERE id = $1;`;
    const managerResult = await db.query(managerQuery, [propertyID]);

    if (managerResult.rows[0].managerid != null) {
      return res.status(400).json({
        success: "Manager contract active, cannot delete.",
      });
    }

    //Check if there is a ManagerHireRequest with the provided propertyID
    const checkQuery = `SELECT * FROM ManagerHireRequest WHERE propertyID = $1 AND managerStatus = 'P';`;
    const checkResult = await db.query(checkQuery, [propertyID]);

    if (checkResult.rows.length === 0) {
      return res.status(400).json({
        success: "Manager hire request does not exist.",
      });
    }

    // Update the managerStatus to 'D' (Deleted) for the ManagerHireRequest with the provided propertyID
    const updateQuery = `
      UPDATE ManagerHireRequest
      SET managerStatus = 'D'
      WHERE propertyID = $1
      AND managerStatus = 'P';
    `;
    await db.query(updateQuery, [propertyID]);

    // Send success response
    res.status(200).json({
      success: "Manager hire request deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting manager hire request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete manager hire request.",
    });
  }
};

//API 7: Fire Manager
export const fireManager = async (req, res) => {
  try {
    // Extract propertyID from request body
    const { propertyID } = req.body;

    // Find the managerID in the Property Table
    const managerIDQuery = `
      SELECT managerID
      FROM Property
      WHERE id = $1;
    `;
    const managerIDResult = await db.query(managerIDQuery, [propertyID]);
    const managerID = managerIDResult.rows[0].managerid;

    // Check if managerID is null
    if (
      managerID === null ||
      managerID === undefined ||
      managerID === "" ||
      managerID === " " ||
      managerID === 0
    ) {
      return res.status(400).json({
        success: "No manager assigned to this property.",
      });
    }

    // Find the managerHireRequestID associated with the property
    const managerHireRequestIDQuery = `
      SELECT id
      FROM ManagerHireRequest
      WHERE propertyID = $1
        AND managerStatus = 'A';
    `;
    const managerHireRequestIDResult = await db.query(
      managerHireRequestIDQuery,
      [propertyID]
    );
    const managerHireRequestID = managerHireRequestIDResult.rows[0].id;

    // Retrieve current month's rent status
    const rentStatusQuery = `
        SELECT tn.id, tn.paymentStatus
        FROM TenantRentNotice tn
        WHERE tn.propertyID = $1 AND 
              EXTRACT(MONTH FROM tn.createdOn) = EXTRACT(MONTH FROM CURRENT_TIMESTAMP) AND
              EXTRACT(YEAR FROM tn.createdOn) = EXTRACT(YEAR FROM CURRENT_TIMESTAMP);
      `;
    const rentStatusResult = await db.query(rentStatusQuery, [propertyID]);
    const rentStatus = rentStatusResult.rows[0];
    const tenantRentNoticeID = rentStatus?.id;

    // Calculate total income
    const totalIncomeQuery = `
        SELECT paymentStatus
        FROM ManagerRentCollection
        WHERE tenantRentNoticeID = $1;
      `;
    const totalIncomeResult = await db.query(totalIncomeQuery, [
      tenantRentNoticeID,
    ]);
    const ManagerPaymentStatus = totalIncomeResult.rows[0];
    // if manager payment status is 'P' or 'V' then return error

    if (
      ManagerPaymentStatus?.paymentstatus === "P" ||
      ManagerPaymentStatus?.paymentstatus === "V"
    ) {
      return res.status(400).json({
        success: "Manager has tenant's rent with him, cannot fire manager.",
      });
    }

    // Update the managerStatus to 'T' in ManagerHireRequest table
    const updateManagerStatusQuery = `
      UPDATE ManagerHireRequest
      SET managerStatus = 'T',
          contractEndDate = CURRENT_DATE
      WHERE id = $1;
    `;
    await db.query(updateManagerStatusQuery, [managerHireRequestID]);

    // Set the managerID as null in Property table
    const updatePropertyManagerIDQuery = `
      UPDATE Property
      SET managerID = NULL
      WHERE id = $1;
    `;
    await db.query(updatePropertyManagerIDQuery, [propertyID]);

    // Check if there is a tenantID in the property table
    const tenantQuery = `
      SELECT tenantID
      FROM Property
      WHERE id = $1;
    `;
    const tenantResult = await db.query(tenantQuery, [propertyID]);

    // Find the owner id from UserInformation table
    const ownerQuery = `
      SELECT ui.id
      FROM Property p
      JOIN UserInformation ui ON p.ownerID = ui.id
      WHERE p.id = $1;
    `;
    const ownerIDResult = await db.query(ownerQuery, [propertyID]);
    const ownerID = ownerIDResult.rows[0].id;

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

    // Send notification to the tenant if exists
    if (tenantResult.rows[0].tenantid !== null) {
      const tenantID = tenantResult.rows[0].tenantid;

      // Send notification to the tenant
      const tenantNotificationQuery = `
        INSERT INTO UserNotification (userID, userType, senderID, senderType, notificationText, notificationType)
        VALUES (
          $1, 'T',
          $2, 'O',
          'The manager for your rental ${propertyAddress} has been fired. You will now be submitting your rent to the owner.', 
          'R'
        );
      `;
      await db.query(tenantNotificationQuery, [tenantID, ownerID]);
    }

    // Send notification to the manager
    const managerNotificationQuery = `
      INSERT INTO UserNotification (userID, userType, senderID, senderType, notificationText, notificationType)
      VALUES (
        $1, 'M',
        $2, 'O',
        'The owner has fired you from managing the property ${propertyAddress}.', 
        'R'
      );
    `;
    await db.query(managerNotificationQuery, [managerID, ownerID]);

    // Get purpose
    const propertyIDQuery = `
      SELECT purpose
      FROM ManagerHireRequest
      WHERE id = $1;
    `;
    const propertyIDResult = await db.query(propertyIDQuery, [
      managerHireRequestID,
    ]);
    const purpose = propertyIDResult.rows[0].purpose;

    //Get tenantID from Property table
    const tenantIDQuery = `
      SELECT tenantID
      FROM Property
      WHERE id = $1;
    `;
    const tenantIDResult = await db.query(tenantIDQuery, [propertyID]);
    const tenantID = tenantIDResult.rows[0].tenantid;

    //Only Caretaking Manager
    if (purpose === "C") {
      // Update the rating ratingEndDate of rating Owner to Manager
      const updateOwnerManagerRatingQuery = `
        UPDATE Rating
        SET ratingEndDate = CURRENT_DATE
        WHERE propertyID = $1
          AND userID = $2
          AND userType = 'O'
          AND ratedByID = $3
          AND ratedByType = 'M';
      `;
      await db.query(updateOwnerManagerRatingQuery, [
        propertyID,
        ownerID,
        managerID,
      ]);

      // Update the rating ratingEndDate of rating Manager to Owner
      const updateManagerOwnerRatingQuery = `
        UPDATE Rating
        SET ratingEndDate = CURRENT_DATE
        WHERE propertyID = $1
          AND userID = $2
          AND userType = 'M'
          AND ratedByID = $3
          AND ratedByType = 'O';
      `;
      await db.query(updateManagerOwnerRatingQuery, [
        propertyID,
        managerID,
        ownerID,
      ]);
    }

    if (tenantID) {
      // Update the rating ratingEndDate of rating Tenant to Manager
      const updateTenantManagerRatingQuery = `
        UPDATE Rating
        SET ratingEndDate = CURRENT_DATE
        WHERE propertyID = $1
          AND userID = $2
          AND userType = 'T'
          AND ratedByID = $3
          AND ratedByType = 'M';
      `;
      await db.query(updateTenantManagerRatingQuery, [
        propertyID,
        tenantID,
        managerID,
      ]);

      // Update the rating ratingEndDate of rating Manager to Tenant
      const updateManagerTenantRatingQuery = `
        UPDATE Rating
        SET ratingEndDate = CURRENT_DATE
        WHERE propertyID = $1
          AND userID = $2
          AND userType = 'M'
          AND ratedByID = $3
          AND ratedByType = 'T';
      `;
      await db.query(updateManagerTenantRatingQuery, [
        propertyID,
        managerID,
        tenantID,
      ]);
    }

    // Send success response
    res.status(200).json({
      success: "Manager fired successfully.",
    });
  } catch (error) {
    console.error("Error firing manager:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fire manager.",
    });
  }
};
