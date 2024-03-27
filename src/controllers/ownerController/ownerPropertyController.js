import db from "../../config/config.js";

//API 1: Fetch Property Data
export const fetchPropertyData = async (req, res) => {
  try {
    // Function to determine the parent of an area
    const getParent = (label, areas) => {
      const splitLabel = label.split("/");
      if (splitLabel.length > 1) {
        const parentLabel = splitLabel[0];
        const parentArea = areas.find((area) => area.label === parentLabel);
        return parentArea ? parentArea.value : null;
      }

      const markazIndex = label.indexOf(" Markaz");
      if (markazIndex !== -1) {
        const parentLabel = label.substring(0, markazIndex);
        const parentArea = areas.find((area) => area.label === parentLabel);
        return parentArea ? parentArea.value : null;
      }

      return null;
    };

    // Fetch data from City table
    const cityQuery = "SELECT id, cityName FROM City";
    const citiesResult = await db.query(cityQuery);
    const cities = citiesResult.rows;

    // Fetch data from Area table and sort by areaName
    const areaQuery = `SELECT id, areaName, cityID
FROM Area
ORDER BY id ASC;`;
    const areasResult = await db.query(areaQuery);

    // Create an array of areas without the parent property
    const areasWithoutParent = areasResult.rows.map((area) => ({
      value: area.id,
      label: area.areaname,
      cityID: area.cityid,
    }));

    // Create the final areas array with the parent property
    const areas = areasWithoutParent.map((area) => ({
      ...area,
      parent: getParent(area.label, areasWithoutParent),
    }));

    // Fetch data from PropertyType table
    const propertyTypeQuery = "SELECT id, propertyType FROM PropertyType";
    const propertyTypesResult = await db.query(propertyTypeQuery);
    const propertyTypes = propertyTypesResult.rows;

    // Fetch data from PropertySubType table
    const propertySubTypeQuery =
      "SELECT id, propertySubType, propertyTypeID FROM PropertySubType";
    const propertySubTypesResult = await db.query(propertySubTypeQuery);

    // Group propertySubTypes by propertyTypeID
    const propertySubTypes = propertySubTypesResult.rows.reduce(
      (acc, propertySubType) => {
        const key = propertySubType.propertytypeid;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push({
          value: propertySubType.id,
          label: propertySubType.propertysubtype,
        });
        return acc;
      },
      {}
    );

    // Construct response object with names and IDs
    const responseData = {
      cities: cities.map((city) => ({ value: city.id, label: city.cityname })),
      areas: areas,
      propertyTypes: propertyTypes.map((propertyType) => ({
        value: propertyType.id,
        label: propertyType.propertytype,
      })),
      propertySubTypes: propertySubTypes,
    };

    // Send response
    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error in fetching property data:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

//API 2: Add Property
export const addProperty = async (req, res) => {
  try {
    // Extract inputs from request body
    const {
      userID,
      areaID,
      propertySubTypeID,
      street,
      building,
      // Extract property amenity data list fields
      areaSqft,
      height,
      noOfAppartment,
      noOfBalcony,
      noOfBedroom,
      noOfFloor,
      noOfKitchen,
      noOfLounge,
      noOfConferenceRoom,
      noOfOffice,
      noOfStoreroom,
      noOfShops,
      noOfToilet,
      parkingCapacity,
      personCapacity,
      hasDayCare,
      hasGarden,
      hasElectiricity,
      hasGas,
      hasLift,
      hasPrayerRoom,
      hasRoofAccess,
      hasSafetyExit,
      hasSeperateMeter,
      hasServentRoom,
      hasWifi,
      isAirConditioned,
      isFurnished,
      isShared,
      WaterAvailabilityType,
    } = req.body;

    // Insert property amenity data into PropertyAmenity table
    const propertyAmenityQuery = `
            INSERT INTO PropertyAmenity (
              areaSqft,
              height,
              noOfAppartment,
              noOfBalcony,
              noOfBedroom,
              noOfFloor,
              noOfKitchen,
              noOfLounge,
              noOfConferenceRoom,
              noOfOffice,
              noOfStoreroom,
              noOfShops,
              noOfToilet,
              parkingCapacity,
              personCapacity,
              hasDayCare,
              hasGarden,
              hasElectiricity,
              hasGas,
              hasLift,
              hasPrayerRoom,
              hasRoofAccess,
              hasSafetyExit,
              hasSeperateMeter,
              hasServentRoom,
              hasWifi,
              isAirConditioned,
              isFurnished,
              isShared,
              WaterAvailabilityType
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30)
            RETURNING id;
          `;
    const propertyAmenityValues = [
      areaSqft,
      height,
      noOfAppartment,
      noOfBalcony,
      noOfBedroom,
      noOfFloor,
      noOfKitchen,
      noOfLounge,
      noOfConferenceRoom,
      noOfOffice,
      noOfStoreroom,
      noOfShops,
      noOfToilet,
      parkingCapacity,
      personCapacity,
      hasDayCare,
      hasGarden,
      hasElectiricity,
      hasGas,
      hasLift,
      hasPrayerRoom,
      hasRoofAccess,
      hasSafetyExit,
      hasSeperateMeter,
      hasServentRoom,
      hasWifi,
      isAirConditioned,
      isFurnished,
      isShared,
      WaterAvailabilityType,
    ];
    const propertyAmenityResult = await db.query(
      propertyAmenityQuery,
      propertyAmenityValues
    );

    // Get the generated property amenity ID
    const propertyAmenityID = propertyAmenityResult.rows[0].id;

    // Insert property data into Property table
    const propertyQuery = `
            INSERT INTO Property (
              ownerID,
              areaID,
              propertySubTypeID,
              street,
              building,
              propertyAmenityID,
              propertyStatus
            ) VALUES ($1, $2, $3, $4, $5, $6, 'V');
          `;
    const propertyValues = [
      userID,
      areaID,
      propertySubTypeID,
      street,
      building,
      propertyAmenityID,
    ];
    await db.query(propertyQuery, propertyValues);

    // Send success response
    res.status(200).json({ success: true });
  } catch (error) {
    // Send error response
    console.error("Error adding property:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred while adding the property.",
    });
  }
};

//API 3: Fetch Property List for Owner
export const fetchPropertyList = async (req, res) => {
  try {
    const { userID } = req.body;

    if (!userID) {
      return res.status(400).json({ error: "UserID is required." });
    }

    // Fetch properties registered to the user
    const propertyQuery = `
          SELECT 
            CONCAT(p.building, ', ', p.street, ', ', a.areaName, ', ', c.cityName) AS address, 
            t.firstName AS tenantName, 
            m.firstName AS managerName, 
            p.propertyStatus 
          FROM Property p
          JOIN Area a ON p.areaID = a.id
          JOIN City c ON a.cityID = c.id
          LEFT JOIN UserInformation t ON p.tenantID = t.id
          LEFT JOIN UserInformation m ON p.managerID = m.id
          WHERE p.ownerID = $1
        `;
    const propertiesResult = await db.query(propertyQuery, [userID]);
    const properties = propertiesResult.rows;

    // Send response
    res.status(200).json(properties);
  } catch (error) {
    console.error("Error in fetching property list:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};
