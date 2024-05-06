import db from "../config/config.js";

// API: Test Query
export const testQuery = async (req, res) => {
  try {
    // Extract managerID from request body
    const { managerID } = req.body;

    // Get the list of all pending hiring requests with associated counter requests
    const query = `
      SELECT MHR.id,
             CONCAT(UI.firstName, ' ', UI.lastName) AS "ownerName",
             CONCAT(P.propertyAddress, ', ', A.areaName, ', ', C.cityName) AS "propertyAddress",
             MHR.purpose,
             MHC.counterRequestStatus
      FROM ManagerHireRequest MHR
      JOIN Property P ON MHR.propertyID = P.id
      JOIN Area A ON P.areaID = A.id
      JOIN City C ON A.cityID = C.id
      JOIN UserInformation UI ON P.ownerID = UI.id
      LEFT JOIN ManagerHireCounterRequest MHC ON MHR.id = MHC.managerHireRequestID
                                                 AND MHC.managerID = $1
                                                 AND MHC.counterRequestStatus IN ('P', 'I')
      WHERE MHR.managerStatus = 'P'
      AND P.ownerID != $1
      ORDER BY MHR.id DESC;
    `;

    // Execute the query
    const hiringRequests = await db.query(query, [managerID]);

    // Send the list of hiring requests with associated counter requests as response
    res.status(200).json(hiringRequests.rows);
  } catch (error) {
    console.error(
      "Error viewing hiring requests with associated counter requests:",
      error
    );
    res.status(500).json({
      success: false,
      message:
        "Failed to view hiring requests with associated counter requests.",
    });
  }
};
