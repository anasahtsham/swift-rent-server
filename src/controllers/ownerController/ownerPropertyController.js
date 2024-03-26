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
