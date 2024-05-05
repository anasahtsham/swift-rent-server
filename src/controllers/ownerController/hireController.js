import db from "../../config/config.js";

// API 1: Generate Maintenance Report
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
      parseInt(salaryFixed),
      parseInt(salaryPercentage),
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
