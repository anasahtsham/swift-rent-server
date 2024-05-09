import db from "../../config/config.js";

//API 1: List of Rentals
export const listOfRentals = async (req, res) => {
  const { tenantID } = req.body;

  try {
    // Fetch active leases for the given tenantID
    const activeLeasesQuery = `
      SELECT pl.propertyID, 
             CONCAT(P.propertyAddress, ', ', A.areaName, ', ', C.cityName) AS address, 
             uo.firstName AS ownerFirstName, 
             uo.lastName AS ownerLastName,
             um.firstName AS managerFirstName, 
             um.lastName AS managerLastName
      FROM PropertyLease pl
      INNER JOIN Property P ON pl.propertyID = P.id
      INNER JOIN Area A ON P.areaID = A.id
      INNER JOIN City C ON A.cityID = C.id
      INNER JOIN UserInformation uo ON P.ownerID = uo.id
      LEFT JOIN UserInformation um ON p.managerID = um.id
      WHERE pl.tenantID = $1 AND pl.leaseStatus = 'A'
      ORDER BY pl.leaseCreatedOn DESC;
    `;
    const { rows } = await db.query(activeLeasesQuery, [tenantID]);

    if (rows.length === 0) {
      return res.status(200).json({ message: "No active rentals found" });
    }

    // Format the response data
    const rentals = rows.map((row) => ({
      id: row.propertyid,
      address: row.address,
      ownerName: `${row.ownerfirstname} ${row.ownerlastname}`,
      managerName: row.managerfirstname
        ? `${row.managerfirstname} ${row.managerlastname}`
        : null,
    }));

    res.status(200).json({ rentals });
  } catch (error) {
    console.error("Error fetching list of rentals:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
