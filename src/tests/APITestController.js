import db from "../config/config.js";

//API 1: Test Query
export const testQuery = async (req, res) => {
  try {
    //Get the managerCounterRequestID from the request body
    const { managerID } = req.body;

    const managerNameQuery = `
    SELECT CONCAT(firstName, ' ', lastName) AS managerName
    FROM UserInformation
    WHERE id = $1;
  `;
    const managerNameResult = await db.query(managerNameQuery, [managerID]);
    const managerName = managerNameResult.rows[0].managerName;

    //Send the result as response
    res.status(200).json({ data: managerNameResult.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
