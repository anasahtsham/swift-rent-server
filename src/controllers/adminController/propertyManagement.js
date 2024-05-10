import db from "../../config/config.js";

export const viewPropertyList = async (req, res) => {
  try {
    // Query to retrieve property list details
    const query = `
        SELECT 
          p.id AS propertyID,
          p.ownerID AS ownerID,
          CONCAT(ui.firstName, ' ', ui.lastName) AS ownerName,
          p.tenantID AS tenantID,
          CONCAT(t.firstName, ' ', t.lastName) AS tenantName,
          p.managerID AS managerID,
          CONCAT(m.firstName, ' ', m.lastName) AS managerName,
          CONCAT(p.propertyAddress, ', ', a.areaName, ', ', c.cityName) AS fullAddress,
          TO_CHAR(p.registeredOn, 'DD-MM-YYYY HH24:MM') AS propertyRegisteredOn,
          p.onRentDays AS propertyOnRentDays,
          p.offRentDays AS propertyOffRentDays,
          p.propertyStatus AS propertyStatus
        FROM Property p
        JOIN UserInformation ui ON p.ownerID = ui.id
        LEFT JOIN UserInformation t ON p.tenantID = t.id
        LEFT JOIN UserInformation m ON p.managerID = m.id
        JOIN Area a ON p.areaID = a.id
        JOIN City c ON a.cityID = c.id
        ORDER BY p.id DESC
      `;

    // Execute the query
    const result = await db.query(query);

    // Send the property list as the response
    return res.status(200).json({
      success: true,
      propertyList: result.rows,
    });
  } catch (error) {
    console.error("Error fetching property list:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch property list.",
      message: error.message,
    });
  }
};
