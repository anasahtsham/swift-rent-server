import db from "../../config/config.js";

//API 1: Get a list of all cities
export const getCities = async (req, res) => {
  try {
    // Get the list of all cities
    const query = `
    SELECT LOWER(cityName) AS cityName
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

//API 2: Get a list of all cities in a specific format
export const getCitiesDropdown = async (req, res) => {
  try {
    // Get the list of all cities
    const query = `
          SELECT cityName, LOWER(cityName) AS lowerCityName
          FROM City
          ORDER BY id ASC;
        `;
    const cities = await db.query(query);

    // Format the cities
    const formattedCities = cities.rows.map((city) => ({
      label: city.cityname,
      value: city.lowercityname,
    }));

    // Add "All Cities" option
    formattedCities.push({ label: "All Cities", value: "all_cities" });

    // Send the list of cities as response
    res.status(200).json(formattedCities);
  } catch (error) {
    console.error("Error fetching cities:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch cities.",
    });
  }
};

// API 3: Display all manager hire requests
export const viewHireRequests = async (req, res) => {
  try {
    // Get the list of all pending hiring requests
    const query = `
    SELECT MHR.id,
            CONCAT(UI.firstName, ' ', UI.lastName) AS "ownerName",
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

// API 4: Detailed view of a manager hire request
export const detailedHiringRequest = async (req, res) => {
  try {
    // Extract managerHireRequestID from request parameters
    const { managerHireRequestID } = req.body;
    console.log("managerHireRequestID:", managerHireRequestID);

    // Get detailed information about the hiring request
    const query = `
          SELECT CONCAT(UI.firstName, ' ', UI.lastName) AS "ownerName",
                 CONCAT(P.propertyAddress, ', ', A.areaName, ', ', C.cityName) AS "propertyAddress",
                 MHR.purpose,
                 MHR.oneTimePay,
                 MHR.salaryPaymentType,
                 MHR.salaryFixed,
                 MHR.salaryPercentage,
                 MHR.whoBringsTenant,
                 MHR.rent,
                 MHR.specialCondition,
                 MHR.needHelpWithLegalWork
          FROM ManagerHireRequest MHR
          JOIN Property P ON MHR.propertyID = P.id
          JOIN Area A ON P.areaID = A.id
          JOIN City C ON A.cityID = C.id
          JOIN UserInformation UI ON P.ownerID = UI.id
          WHERE MHR.id = $1;
        `;
    const detailedRequest = await db.query(query, [managerHireRequestID]);

    // Send the detailed hiring request as response
    res.status(200).json(detailedRequest.rows[0]);
  } catch (error) {
    console.error("Error fetching detailed hiring request:", error);
    res.status(500).json({
      success: "Failed to fetch detailed hiring request.",
    });
  }
};
