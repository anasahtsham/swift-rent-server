import db from "../../config/config.js";

// // Analytics: Users
// export const getUsersAnalytics = async (req, res) => {
//   try {
//     const result = await db.query(`
//       SELECT
//         COUNT(*) AS "NoOfUsers",
//         SUM(CASE WHEN isOwner THEN 1 ELSE 0 END) AS "NoOfOwners",
//         SUM(CASE WHEN isTenant THEN 1 ELSE 0 END) AS "NoOfTenants",
//         SUM(CASE WHEN isManager THEN 1 ELSE 0 END) AS "NoOfManagers"
//       FROM UserInformation
//       WHERE NOT isBanned
//     `);
//     const analytics = result.rows[0];
//     res.status(200).json({ ...analytics });
//   } catch (error) {
//     console.error("Error fetching users analytics:", error);
//     res
//       .status(500)
//       .json({ success: false, message: "Failed to fetch users analytics." });
//   }
// };

// // Analytics: Properties
// export const getPropertiesAnalytics = async (req, res) => {
//   try {
//     const propertiesResult = await db.query(`
//       SELECT COUNT(*) AS "NoOfProperties" FROM Property WHERE propertyStatus != 'D'
//     `);
//     const propertiesCount = propertiesResult.rows[0]["NoOfProperties"];

//     const citiesResult = await db.query(`
//       SELECT C.cityName, COUNT(*) AS "NoOfPropertiesInCity"
//       FROM Property P
//       JOIN Area A ON P.areaID = A.id
//       JOIN City C ON A.cityID = C.id
//       WHERE P.propertyStatus != 'D'
//       GROUP BY C.cityName
//     `);
//     const cities = citiesResult.rows.map((row) => ({
//       cityName: row.cityname,
//       NoOfProperties: row.NoOfPropertiesInCity,
//     }));

//     res.status(200).json({ NoOfProperties: propertiesCount, cities });
//   } catch (error) {
//     console.error("Error fetching properties analytics:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch properties analytics.",
//     });
//   }
// };

// // Analytics: Property Statuses
// export const getPropertyStatusesAnalytics = async (req, res) => {
//   try {
//     const result = await db.query(`
//       SELECT
//         COUNT(*) AS "NoOfProperties",
//         SUM(CASE WHEN propertyStatus = 'V' THEN 1 ELSE 0 END) AS "NoOfVacantProperties",
//         SUM(CASE WHEN propertyStatus = 'L' THEN 1 ELSE 0 END) AS "NoOfLeasedProperties"
//       FROM Property
//       WHERE propertyStatus != 'D'
//     `);
//     const analytics = result.rows[0];
//     res.status(200).json({ ...analytics });
//   } catch (error) {
//     console.error("Error fetching property statuses analytics:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch property statuses analytics.",
//     });
//   }
// };

// // Analytics: User Complaints
// export const getUserComplaintsAnalytics = async (req, res) => {
//   try {
//     const result = await db.query(`
//       SELECT
//         COUNT(*) AS "NoOfComplaints",
//         SUM(CASE WHEN complaintStatus = 'S' THEN 1 ELSE 0 END) AS "NoOfSolved",
//         SUM(CASE WHEN complaintStatus = 'R' THEN 1 ELSE 0 END) AS "NoOfRejected",
//         SUM(CASE WHEN complaintStatus = 'P' THEN 1 ELSE 0 END) AS "NoOfPending",
//         SUM(CASE WHEN complaintStatus = 'I' THEN 1 ELSE 0 END) AS "NoOfInProgress"
//       FROM AdminComplaint
//     `);
//     const analytics = result.rows[0];
//     res.status(200).json({ ...analytics });
//   } catch (error) {
//     console.error("Error fetching user complaints analytics:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch user complaints analytics.",
//     });
//   }
// };

// // Analytics: Property Types Per City
// export const getPropertyTypesPerCityAnalytics = async (req, res) => {
//   try {
//     // Fetch property types per city data from the database
//     const result = await db.query(`
//     SELECT
//         C.cityName,
//         PST.propertySubType,
//         (
//         SELECT COUNT(*)
//         FROM Property P
//         WHERE P.areaID = A.id
//             AND P.propertySubTypeID = PST.id
//         ) AS "NoOfPropertiesPerSubType"
//     FROM City C
//     LEFT JOIN Area A ON C.id = A.cityID
//     LEFT JOIN PropertySubType PST ON TRUE
//     WHERE EXISTS (
//         SELECT 1
//         FROM Property P
//         WHERE P.areaID = A.id
//             AND P.propertySubTypeID = PST.id
//     )
//     ORDER BY C.cityName, PST.propertySubType;
//       `);

//     // Process the query result to aggregate property types per city
//     const analytics = {};
//     result.rows.forEach((row) => {
//       const { cityname, propertysubtype, NoOfPropertiesPerSubType } = row;
//       if (!analytics[cityname]) {
//         analytics[cityname] = {};
//       }
//       if (!analytics[cityname][propertysubtype]) {
//         analytics[cityname][propertysubtype] = 0;
//       }
//       analytics[cityname][propertysubtype] += NoOfPropertiesPerSubType;
//     });

//     res.status(200).json({ analytics });
//   } catch (error) {
//     console.error("Error fetching property types per city analytics:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch property types per city analytics.",
//     });
//   }
// };

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
