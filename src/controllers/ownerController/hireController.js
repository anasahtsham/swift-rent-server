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

    // Query to fetch manager hire counter requests
    const query = `
      SELECT MHC.id,
             CONCAT(UI.firstName, ' ', UI.lastName) AS "managerName",
             MHC.oneTimePay,
             MHC.salaryFixed,
             MHC.salaryPercentage,
             MHC.rent,
             TO_CHAR(MHC.counterRequestOn, 'DD-MM-YYYY HH24:MI') AS "counterRequestOn"
      FROM ManagerHireRequest MHR
      JOIN ManagerHireCounterRequest MHC ON MHR.id = MHC.managerHireRequestID
      JOIN UserInformation UI ON MHC.managerID = UI.id
      JOIN Property P ON MHR.propertyID = P.id
      JOIN Area A ON P.areaID = A.id
      JOIN City C ON A.cityID = C.id
      WHERE P.id = $1 AND MHR.managerStatus = 'P';
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
