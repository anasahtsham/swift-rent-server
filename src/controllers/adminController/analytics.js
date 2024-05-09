import db from "../../config/config.js";

// API 1: Pie Chart Analytics
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

// API 2: Property Statuses with Cities (SunBurst)
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
            id: "Rented",
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

// API 3: Property Types Per City (Horizontal Stacked Bar Graph)
export const getPropertyTypesPerCityAnalytics = async (req, res) => {
  try {
    // Fetch property types per city data from the database
    const result = await db.query(`
      SELECT
          C.cityName AS city,
          COALESCE(SUM(CASE WHEN PST.propertySubType = 'Agricultural Plot' THEN 1 ELSE 0 END), 0) AS "Agricultural Plot",
          COALESCE(SUM(CASE WHEN PST.propertySubType = 'Apartment' THEN 1 ELSE 0 END), 0) AS "Apartment",
          COALESCE(SUM(CASE WHEN PST.propertySubType = 'Building' THEN 1 ELSE 0 END), 0) AS "Building",
          COALESCE(SUM(CASE WHEN PST.propertySubType = 'Commercial Plot' THEN 1 ELSE 0 END), 0) AS "Commercial Plot",
          COALESCE(SUM(CASE WHEN PST.propertySubType = 'Factory' THEN 1 ELSE 0 END), 0) AS "Factory",
          COALESCE(SUM(CASE WHEN PST.propertySubType = 'House' THEN 1 ELSE 0 END), 0) AS "House",
          COALESCE(SUM(CASE WHEN PST.propertySubType = 'Industrial Plot' THEN 1 ELSE 0 END), 0) AS "Industrial Plot",
          COALESCE(SUM(CASE WHEN PST.propertySubType = 'Lower Floor' THEN 1 ELSE 0 END), 0) AS "Lower Floor",
          COALESCE(SUM(CASE WHEN PST.propertySubType = 'Office' THEN 1 ELSE 0 END), 0) AS "Office",
          COALESCE(SUM(CASE WHEN PST.propertySubType = 'Room' THEN 1 ELSE 0 END), 0) AS "Room",
          COALESCE(SUM(CASE WHEN PST.propertySubType = 'Shop' THEN 1 ELSE 0 END), 0) AS "Shop",
          COALESCE(SUM(CASE WHEN PST.propertySubType = 'Upper Floor' THEN 1 ELSE 0 END), 0) AS "Upper Floor",
          COALESCE(SUM(CASE WHEN PST.propertySubType = 'Warehouse' THEN 1 ELSE 0 END), 0) AS "Warehouse"
      FROM City C
      LEFT JOIN Area A ON C.id = A.cityID
      LEFT JOIN Property P ON A.id = P.areaID
      LEFT JOIN PropertySubType PST ON P.propertySubTypeID = PST.id
      GROUP BY C.cityName
      ORDER BY C.cityName
    `);

    // Process the query result to aggregate property types per city
    const analytics = result.rows.map((row) => {
      return {
        city: row.city,
        "Agricultural Plots": parseInt(row["Agricultural Plot"]),
        Apartments: parseInt(row.Apartment),
        Buildings: parseInt(row.Building),
        "Commercial Plots": parseInt(row["Commercial Plot"]),
        Factories: parseInt(row.Factory),
        Houses: parseInt(row.House),
        "Industrial Plots": parseInt(row["Industrial Plot"]),
        "Lower Floors": parseInt(row["Lower Floor"]),
        Offices: parseInt(row.Office),
        Rooms: parseInt(row.Room),
        Shops: parseInt(row.Shop),
        "Upper Floors": parseInt(row["Upper Floor"]),
        Warehouses: parseInt(row.Warehouse),
      };
    });

    res.status(200).json(analytics);
  } catch (error) {
    console.error("Error fetching property types per city analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch property types per city analytics.",
    });
  }
};
