import db from "../../config/config.js";

//API 1: Get a list of all cities
export const getCities = async (req, res) => {
  try {
    // Get the list of all cities
    const query = `
          SELECT cityName
          FROM City
          ORDER BY id ASC;
        `;
    const cities = await db.query(query);

    // Send the list of cities as response
    res.status(200).json(cities.rows);
  } catch (error) {
    console.error("Error fetching cities:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch cities.",
    });
  }
};

// API 2: Display all manager hire requests
export const viewHireRequests = async (req, res) => {
  try {
    // Get the list of all pending hiring requests
    const query = `
        SELECT MHR.id AS "id (managerHireRequest)",
               CONCAT(UI.firstName, ' ', UI.lastName) AS "owner name",
               CONCAT(P.propertyAddress, ', ', A.areaName, ', ', C.cityName) AS "propertyAddress",
               MHR.purpose
        FROM ManagerHireRequest MHR
        JOIN Property P ON MHR.propertyID = P.id
        JOIN Area A ON P.areaID = A.id
        JOIN City C ON A.cityID = C.id
        JOIN UserInformation UI ON P.ownerID = UI.id
        WHERE MHR.managerStatus = 'P'
        ORDER BY MHR.id DESC;
      `;
    const hiringRequests = await db.query(query);

    // Send the list of hiring requests as response
    res.status(200).json(hiringRequests.rows);
  } catch (error) {
    console.error("Error viewing hiring requests:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to view hiring requests." });
  }
};
