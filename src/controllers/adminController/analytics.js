import db from "../../config/config.js";

// Pie Chart Analytics
export const getAnalyticsPieCharts = async (req, res) => {
  try {
    // Query to fetch analytics for users, user complaints, and payments
    const usersResult = await db.query(`
      SELECT
        SUM(CASE WHEN isOwner THEN 1 ELSE 0 END) AS "NoOfOwners",
        SUM(CASE WHEN isTenant THEN 1 ELSE 0 END) AS "NoOfTenants",
        SUM(CASE WHEN isManager THEN 1 ELSE 0 END) AS "NoOfManagers"
      FROM UserInformation
      WHERE NOT isBanned
    `);

    const complaintsResult = await db.query(`
      SELECT
        SUM(CASE WHEN complaintStatus = 'S' THEN 1 ELSE 0 END) AS "NoOfSolved",
        SUM(CASE WHEN complaintStatus = 'R' THEN 1 ELSE 0 END) AS "NoOfRejected",
        SUM(CASE WHEN complaintStatus = 'P' THEN 1 ELSE 0 END) AS "NoOfPending",
        SUM(CASE WHEN complaintStatus = 'I' THEN 1 ELSE 0 END) AS "NoOfInProgress"
      FROM AdminComplaint
    `);

    const paymentsResult = await db.query(`
      SELECT 
        SUM(CASE WHEN isLate THEN 1 ELSE 0 END) AS "NoOfLatePayments",
        SUM(CASE WHEN NOT isLate THEN 1 ELSE 0 END) AS "NoOfTimelyPayments"
      FROM TenantRentNotice
    `);

    // Extract the analytics from the query results
    const usersAnalytics = usersResult.rows[0];
    const complaintsAnalytics = complaintsResult.rows[0];
    const paymentsAnalytics = paymentsResult.rows[0];

    // Send the combined analytics as response
    res.status(200).json({
      usersAnalytics,
      complaintsAnalytics,
      paymentsAnalytics,
    });
  } catch (error) {
    // Handle errors
    console.error("Error fetching analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics.",
    });
  }
};

// Analytics: Property Statuses with Cities (SunBurst)
export const getPropertyStatusesWithCities = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        C.cityName,
        COUNT(*) AS "NoOfProperties",
        SUM(CASE WHEN P.propertyStatus = 'V' THEN 1 ELSE 0 END) AS "NoOfVacantProperties",
        SUM(CASE WHEN P.propertyStatus = 'L' THEN 1 ELSE 0 END) AS "NoOfLeasedProperties"
      FROM Property P
      JOIN Area A ON P.areaID = A.id
      JOIN City C ON A.cityID = C.id
      WHERE P.propertyStatus != 'D'
      GROUP BY C.cityName
    `);

    const propertyStatuses = result.rows.map((row, index) => {
      const hue = 218 - Math.floor((index / result.rows.length) * 30); // Adjusting hue dynamically
      const saturation = 89.7;
      const lightness = 40.8 + Math.floor((index / result.rows.length) * 10); // Lightening lightness dynamically
      const cityColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

      return {
        id: row.cityname,
        color: cityColor,
        children: [
          {
            id: "Vacant",
            value: parseInt(row.NoOfVacantProperties),
            color: cityColor,
          },
          {
            id: "Leased",
            value: parseInt(row.NoOfLeasedProperties),
            color: cityColor,
          },
        ],
      };
    });

    res.status(200).json({ children: propertyStatuses });
  } catch (error) {
    console.error("Error fetching property statuses with cities:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch property statuses with cities.",
    });
  }
};

// Analytics: Property Types Per City
export const getPropertyTypesPerCityAnalytics = async (req, res) => {
  try {
    // Fetch property types per city data from the database
    const result = await db.query(`
    SELECT
        C.cityName,
        PST.propertySubType,
        (
        SELECT COUNT(*)
        FROM Property P
        WHERE P.areaID = A.id
            AND P.propertySubTypeID = PST.id
        ) AS "NoOfPropertiesPerSubType"
    FROM City C
    LEFT JOIN Area A ON C.id = A.cityID
    LEFT JOIN PropertySubType PST ON TRUE
    WHERE EXISTS (
        SELECT 1
        FROM Property P
        WHERE P.areaID = A.id
            AND P.propertySubTypeID = PST.id
    )
    ORDER BY C.cityName, PST.propertySubType;
      `);

    // Process the query result to aggregate property types per city
    const analytics = {};
    result.rows.forEach((row) => {
      const { cityname, propertysubtype, NoOfPropertiesPerSubType } = row;
      if (!analytics[cityname]) {
        analytics[cityname] = {};
      }
      if (!analytics[cityname][propertysubtype]) {
        analytics[cityname][propertysubtype] = 0;
      }
      analytics[cityname][propertysubtype] += NoOfPropertiesPerSubType;
    });

    res.status(200).json({ analytics });
  } catch (error) {
    console.error("Error fetching property types per city analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch property types per city analytics.",
    });
  }
};

// Admin Analytics
export const adminAnalytics = async (req, res) => {
  try {
    // Analytics: Users
    const usersResult = await db.query(`
        SELECT 
          COUNT(*) AS "NoOfUsers",
          SUM(CASE WHEN isOwner THEN 1 ELSE 0 END) AS "NoOfOwners",
          SUM(CASE WHEN isTenant THEN 1 ELSE 0 END) AS "NoOfTenants",
          SUM(CASE WHEN isManager THEN 1 ELSE 0 END) AS "NoOfManagers"
        FROM UserInformation
        WHERE NOT isBanned
      `);
    const usersAnalytics = usersResult.rows[0];

    // Analytics: Properties
    const propertiesResult = await db.query(`
        SELECT COUNT(*) AS "NoOfProperties" FROM Property WHERE propertyStatus != 'D'
      `);
    const propertiesCount = propertiesResult.rows[0]["NoOfProperties"];

    const citiesResult = await db.query(`
        SELECT C.cityName, COUNT(*) AS "NoOfPropertiesInCity"
        FROM Property P
        JOIN Area A ON P.areaID = A.id
        JOIN City C ON A.cityID = C.id
        WHERE P.propertyStatus != 'D'
        GROUP BY C.cityName
      `);
    const cities = citiesResult.rows.map((row) => ({
      cityName: row.cityname,
      NoOfProperties: row.NoOfPropertiesInCity,
    }));

    // Analytics: Property Statuses
    const propertyStatusesResult = await db.query(`
        SELECT 
          COUNT(*) AS "NoOfProperties",
          SUM(CASE WHEN propertyStatus = 'V' THEN 1 ELSE 0 END) AS "NoOfVacantProperties",
          SUM(CASE WHEN propertyStatus = 'L' THEN 1 ELSE 0 END) AS "NoOfLeasedProperties"
        FROM Property
        WHERE propertyStatus != 'D'
      `);
    const propertyStatusesAnalytics = propertyStatusesResult.rows[0];

    // Analytics: User Complaints
    const userComplaintsResult = await db.query(`
        SELECT 
          COUNT(*) AS "NoOfComplaints",
          SUM(CASE WHEN complaintStatus = 'S' THEN 1 ELSE 0 END) AS "NoOfSolved",
          SUM(CASE WHEN complaintStatus = 'R' THEN 1 ELSE 0 END) AS "NoOfRejected",
          SUM(CASE WHEN complaintStatus = 'P' THEN 1 ELSE 0 END) AS "NoOfPending",
          SUM(CASE WHEN complaintStatus = 'I' THEN 1 ELSE 0 END) AS "NoOfInProgress"
        FROM AdminComplaint
      `);
    const userComplaintsAnalytics = userComplaintsResult.rows[0];

    // Analytics: Property Types Per City
    const propertyTypesPerCityResult = await db.query(`
        SELECT 
            C.cityName,
            PST.propertySubType,
            (
            SELECT COUNT(*)
            FROM Property P
            WHERE P.areaID = A.id
                AND P.propertySubTypeID = PST.id
            ) AS "NoOfPropertiesPerSubType"
        FROM City C
        LEFT JOIN Area A ON C.id = A.cityID
        LEFT JOIN PropertySubType PST ON TRUE
        WHERE EXISTS (
            SELECT 1
            FROM Property P
            WHERE P.areaID = A.id
                AND P.propertySubTypeID = PST.id
        )
        ORDER BY C.cityName, PST.propertySubType;
      `);

    // Process the query result to aggregate property types per city
    const propertyTypesPerCityAnalytics = {};
    propertyTypesPerCityResult.rows.forEach((row) => {
      const { cityname, propertysubtype, NoOfPropertiesPerSubType } = row;
      if (!propertyTypesPerCityAnalytics[cityname]) {
        propertyTypesPerCityAnalytics[cityname] = {};
      }
      if (!propertyTypesPerCityAnalytics[cityname][propertysubtype]) {
        propertyTypesPerCityAnalytics[cityname][propertysubtype] = 0;
      }
      propertyTypesPerCityAnalytics[cityname][propertysubtype] +=
        NoOfPropertiesPerSubType;
    });

    res.status(200).json({
      usersAnalytics,
      propertiesCount,
      cities,
      propertyStatusesAnalytics,
      userComplaintsAnalytics,
      propertyTypesPerCityAnalytics,
    });
  } catch (error) {
    console.error("Error fetching admin analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin analytics.",
    });
  }
};
