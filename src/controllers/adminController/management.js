import db from "../../config/config.js";

//API 1: City List
export const cityList = async (req, res) => {
  try {
    const cityList = await db.query("SELECT * FROM city");
    return res.status(200).json(cityList.rows);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

//API 2: Add City
export const addCity = async (req, res) => {
  try {
    const { cityName } = req.body;
    const newCity = await db.query(
      "INSERT INTO city (cityName) VALUES ($1) RETURNING *",
      [cityName]
    );
    return res.status(200).json(newCity.rows[0]);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

//API 3: Delete City
export const deleteCity = async (req, res) => {
  try {
    const { cityID } = req.body;
    //Check if city exists
    const city = await db.query("SELECT * FROM city WHERE id = $1", [cityID]);
    if (city.rows.length === 0) {
      return res.status(400).json({ error: "City does not exist" });
    }
    //Check if aras exist in the city
    const area = await db.query("SELECT * FROM area WHERE cityID = $1", [
      cityID,
    ]);
    if (area.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Areas exist in the city, cannot delete" });
    }
    await db.query("DELETE FROM city WHERE id = $1", [cityID]);
    return res.status(200).json({ message: "City Deleted" });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

//API 4: Update City
export const updateCity = async (req, res) => {
  try {
    const { cityID, cityName } = req.body;
    const updatedCity = await db.query(
      "UPDATE city SET cityName = $1 WHERE id = $2 RETURNING *",
      [cityName, cityID]
    );
    return res.status(200).json(updatedCity.rows[0]);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

//API 5: City Area List
export const areaList = async (req, res) => {
  try {
    //inputs
    const { cityID } = req.body;
    //Check if city exists
    const city = await db.query("SELECT * FROM city WHERE id = $1", [cityID]);
    if (city.rows.length === 0) {
      return res.status(400).json({ error: "City does not exist" });
    }
    const areaList = await db.query("SELECT * FROM area WHERE cityID = $1", [
      cityID,
    ]);
    return res.status(200).json(areaList.rows);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

//API 6: Add Area
export const addArea = async (req, res) => {
  try {
    const { cityID, areaName } = req.body;
    //Check if city exists
    const city = await db.query("SELECT * FROM city WHERE id = $1", [cityID]);
    if (city.rows.length === 0) {
      return res.status(400).json({ error: "City does not exist" });
    }
    const newArea = await db.query(
      "INSERT INTO area (cityID, areaName) VALUES ($1, $2) RETURNING *",
      [cityID, areaName]
    );
    return res.status(200).json(newArea.rows[0]);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

//API 7: Delete Area
export const deleteArea = async (req, res) => {
  try {
    const { areaID } = req.body;
    //Check if area exists
    const area = await db.query("SELECT * FROM area WHERE id = $1", [areaID]);
    if (area.rows.length === 0) {
      return res.status(400).json({ error: "Area does not exist" });
    }
    await db.query("DELETE FROM area WHERE id = $1", [areaID]);
    return res.status(200).json({ message: "Area Deleted" });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

//API 8: Update Area
export const updateArea = async (req, res) => {
  try {
    const { areaID, areaName } = req.body;
    //Check if area exists
    const area = await db.query("SELECT * FROM area WHERE id = $1", [areaID]);
    if (area.rows.length === 0) {
      return res.status(400).json({ error: "Area does not exist" });
    }
    const updatedArea = await db.query(
      "UPDATE area SET areaName = $1 WHERE id = $2 RETURNING *",
      [areaName, areaID]
    );
    return res.status(200).json(updatedArea.rows[0]);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
