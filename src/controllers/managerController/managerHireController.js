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
    // Extract managerID from request body
    const { managerID } = req.body;

    // Get the list of all pending hiring requests with associated counter requests
    const query = `
      SELECT MHR.id,
             CONCAT(UI.firstName, ' ', UI.lastName) AS "ownerName",
             UI.id AS ownerID,
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
      ORDER BY MHC.counterRequestStatus ASC, MHR.id DESC;
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

// API 4: Detailed view of a manager hire request
export const detailedHiringRequest = async (req, res) => {
  try {
    // Extract managerHireRequestID from request parameters
    const { managerHireRequestID } = req.body;

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

//API 5: Counter offer to a manager hire request
export const generateCounterRequest = async (req, res) => {
  try {
    // Extract inputs from the request body
    const {
      managerID,
      managerHireRequestID,
      oneTimePay,
      salaryFixed,
      salaryPercentage,
      rent,
    } = req.body;

    // Check if the manager has a counter request already with counterRequestStatus = P (Pending) or I (Interview) or A (Accepted)
    const checkQuery = `
          SELECT *
          FROM ManagerHireCounterRequest
          WHERE managerID = $1
          AND managerHireRequestID = $2
          AND counterRequestStatus IN ('P', 'I', 'A');
        `;
    const checkResult = await db.query(checkQuery, [
      managerID,
      managerHireRequestID,
    ]);

    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        error:
          "You already have an active counter request submitted for this property.",
      });
    }

    // Send notification to the owner
    const propertyAddressQuery = `
      SELECT
      CONCAT(P.propertyAddress, ', ', A.areaName, ', ', C.cityName) AS address
      FROM Property P
      JOIN Area A ON P.areaID = A.id
      JOIN City C ON A.cityID = C.id
      WHERE P.id = (SELECT propertyID FROM ManagerHireRequest WHERE id = $1);
    `;
    const { rows: addressRows } = await db.query(propertyAddressQuery, [
      managerHireRequestID,
    ]);
    const propertyAddress = addressRows[0].address;

    // Get the phone number of the manager using userInformation table
    const managerPhoneQuery = `
      SELECT phone
      FROM UserInformation
      WHERE id = $1;
    `;
    const { rows: phoneRows } = await db.query(managerPhoneQuery, [managerID]);
    const managerPhone = phoneRows[0].phone;

    const notificationQuery = `
            INSERT INTO UserNotification (userID, userType, senderID, senderType, notificationText, notificationType)
            VALUES (
              (SELECT ownerID FROM Property WHERE id = (SELECT propertyID FROM ManagerHireRequest WHERE id = $1)), 'O',
              $2, 'M',
              'Sent you a counter request for your property ${propertyAddress}. Managers phone: ${managerPhone}',
              'R'
            );
          `;
    await db.query(notificationQuery, [managerHireRequestID, managerID]);

    // Insert counter request into ManagerHireCounterRequest table
    const insertQuery = `
          INSERT INTO ManagerHireCounterRequest (managerHireRequestID, managerID, oneTimePay, salaryFixed, salaryPercentage, rent, counterRequestStatus)
          VALUES ($1, $2, $3, $4, $5, $6, 'P')
        `;
    await db.query(insertQuery, [
      managerHireRequestID,
      managerID,
      oneTimePay,
      salaryFixed,
      salaryPercentage,
      rent,
    ]);

    // Send success response
    res.status(200).json({
      success: "Counter request generated successfully.",
    });
  } catch (error) {
    console.error("Error generating counter request:", error);
    res.status(500).json({ error: "Failed to generate counter request." });
  }
};
