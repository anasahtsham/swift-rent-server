import db from "../../config/config.js";
import { getCurrentMonthName } from "../../helpers/index.js";
import { md5 } from "js-md5";

//API 1: Fetch Property Data
export const fetchPropertyData = async (req, res) => {
  try {
    // Fetch data from City table
    const cityQuery = "SELECT id, cityName FROM City";
    const citiesResult = await db.query(cityQuery);
    const cities = citiesResult.rows;
    console.log(cities);

    // Fetch data from Area table and sort by areaName
    const areaQuery = `SELECT id, areaName, cityID
    FROM Area
    ORDER BY cityID ASC, areaName ASC;`;
    const areasResult = await db.query(areaQuery);
    const areas = areasResult.rows;

    // Fetch data from PropertyType table
    const propertyTypeQuery = "SELECT id, propertyType FROM PropertyType";
    const propertyTypesResult = await db.query(propertyTypeQuery);
    const propertyTypes = propertyTypesResult.rows;

    // Fetch data from PropertySubType table
    const propertySubTypeQuery =
      "SELECT id, propertySubType, propertyTypeID FROM PropertySubType";
    const propertySubTypesResult = await db.query(propertySubTypeQuery);
    const propertySubTypes = propertySubTypesResult.rows;

    // Construct response object with names and IDs
    const responseData = {
      cities: cities.map((city) => ({ id: city.id, name: city.cityname })),
      areas: areas.map((area) => ({
        id: area.id,
        name: area.areaname,
        cityID: area.cityid,
      })),
      propertyTypes: propertyTypes.map((propertyType) => ({
        id: propertyType.id,
        name: propertyType.propertytype,
      })),
      propertySubTypes: propertySubTypes.map((propertySubType) => ({
        id: propertySubType.id,
        name: propertySubType.propertysubtype,
        propertyTypeID: propertySubType.propertytypeid,
      })),
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
