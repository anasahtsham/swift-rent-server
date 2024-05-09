import db from "../../config/config.js";

//API 1: View Managed Properties List
export const viewManagedProperties = async (req, res) => {
  try {
    // Extract managerID from request body
    const { managerID } = req.body;

    // Query to fetch managed properties along with relevant details
    // Query to fetch managed properties along with relevant details
    const query = `
      SELECT
        P.id,
        CONCAT(P.propertyAddress, ', ', AA.areaName, ', ', CC.cityName) AS address,
        
        CONCAT(UIO.firstName, ' ', UIO.lastName) AS ownerName,
        CASE
          WHEN P.tenantID IS NOT NULL THEN CONCAT(UIT.firstName, ' ', UIT.lastName)
          ELSE NULL
        END AS tenantName, 
        P.propertyStatus    
      FROM Property P
      JOIN UserInformation UIM ON P.managerID = UIM.id
      JOIN UserInformation UIO ON P.ownerID = UIO.id
      LEFT JOIN UserInformation UIT ON P.tenantID = UIT.id
      JOIN Area AA ON P.areaID = AA.id
      JOIN City CC ON AA.cityID = CC.id
      WHERE P.managerID = $1
      ORDER BY P.id DESC;
      `;

    // Execute the query to fetch managed properties
    const managedProperties = await db.query(query, [managerID]);

    // Send the list of managed properties as response
    res.status(200).json(managedProperties.rows);
  } catch (error) {
    console.error("Error viewing managed properties:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to view managed properties." });
  }
};
