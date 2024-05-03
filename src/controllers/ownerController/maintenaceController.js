import db from "../../config/config.js";

// Generate Maintenance Report
export const generateMaintenanceReport = async (req, res) => {
  const { propertyID, title, description, cost } = req.body;

  //Check if required fields are empty
  if (!propertyID || !title || !cost) {
    return res
      .status(400)
      .json({ success: false, message: "Please fill all fields." });
  }

  try {
    await db.query(
      `INSERT INTO MaintenanceReport (
        propertyID, maintenanceTitle, 
        maintenanceDescription, maintenanceCost) 
        VALUES ($1, $2, $3, $4)`,
      [propertyID, title, description, cost]
    );
    res.status(200).json({
      success: "Maintenance report generated successfully.",
    });
  } catch (error) {
    console.error("Error generating maintenance report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate maintenance report.",
    });
  }
};

// Display Specific Property Maintenance Report
export const displayMaintenanceReport = async (req, res) => {
  const { ownerID, propertyID } = req.body;

  // Check if ownerID and propertyID are empty
  if (!ownerID || !propertyID) {
    return res.status(400).json({
      success: false,
      message: "Owner ID and Property ID are required.",
    });
  }

  try {
    const result = await db.query(
      `
    SELECT M.id,
      M.maintenanceTitle AS title, 
      M.maintenanceDescription AS description, 
      M.maintenanceCost AS cost, 
      TO_CHAR(M.createdOn, 'DD-MM-YYYY HH24:MI') AS date 
    FROM MaintenanceReport M 
    JOIN Property P ON M.propertyID = P.id 
    WHERE P.ownerID = $1 AND M.propertyID = $2
    ORDER BY M.id DESC`,
      [ownerID, propertyID]
    );
    const maintenanceReports = result.rows.map((row) => ({
      ...row,
      cost: parseInt(row.cost.replace("$", "").replace(/,/g, ""), 10),
    }));
    res.status(200).json({ maintenanceReports });
  } catch (error) {
    console.error(
      "Error fetching specific property maintenance reports:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Failed to fetch specific property maintenance reports.",
    });
  }
};

// Display All Properties Maintenance Reports
export const displayAllMaintenanceReports = async (req, res) => {
  const { ownerID } = req.body;

  // Check if ownerID is empty
  if (!ownerID) {
    return res
      .status(400)
      .json({ success: false, message: "Owner ID is required." });
  }

  try {
    const result = await db.query(
      `
        SELECT M.id,
            CONCAT(P.propertyAddress, ', ', A.areaName, ', ', C.cityName) AS address, 
            M.maintenanceTitle AS title, 
            M.maintenanceDescription AS description, 
            M.maintenanceCost AS cost, 
            TO_CHAR(M.createdOn, 'DD-MM-YYYY HH24:MI') AS date 
        FROM MaintenanceReport M 
        JOIN Property P ON M.propertyID = P.id 
        JOIN Area A ON P.areaID = A.id 
        JOIN City C ON A.cityID = C.id 
        WHERE P.ownerID = $1
        ORDER BY M.id DESC`,
      [ownerID]
    );
    const maintenanceReports = result.rows.map((row) => ({
      ...row,
      cost: parseInt(row.cost.replace("$", "").replace(/,/g, ""), 10),
    }));
    res.status(200).json({ maintenanceReports });
  } catch (error) {
    console.error("Error fetching all properties maintenance reports:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch all properties maintenance reports.",
    });
  }
};
