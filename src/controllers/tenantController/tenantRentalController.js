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

export const fetchPropertyDetail = async (req, res) => {
  try {
    // Extract tenantID and propertyID from request parameters
    const { tenantID, propertyID } = req.body;

    // Part 1: Retrieve property header information
    const headerQuery = `
      SELECT 
        CONCAT(p.propertyAddress, ', ', a.areaName, ', ', c.cityName) AS propertyAddress,
        CONCAT(oui.firstName, ' ', oui.lastName) AS ownerName,
        CONCAT(uim.firstName, ' ', uim.lastName) AS managerName
      FROM Property p
      JOIN Area a ON p.areaID = a.id
      JOIN City c ON a.cityID = c.id
      JOIN UserInformation oui ON p.ownerID = oui.id
      LEFT JOIN ManagerHireRequest mhr ON p.managerID = mhr.managerID
      LEFT JOIN UserInformation uim ON mhr.managerID = uim.id
      WHERE p.id = $1;
    `;
    const headerResult = await db.query(headerQuery, [propertyID]);
    const header = headerResult.rows[0];

    // Retrieve current month's rent status
    const rentStatusQuery = `
      SELECT paymentStatus
      FROM TenantRentNotice
      WHERE tenantID = $1 AND propertyID = $2 AND
            EXTRACT(MONTH FROM createdOn) = EXTRACT(MONTH FROM CURRENT_TIMESTAMP) AND
            EXTRACT(YEAR FROM createdOn) = EXTRACT(YEAR FROM CURRENT_TIMESTAMP);
    `;
    const rentStatusResult = await db.query(rentStatusQuery, [
      tenantID,
      propertyID,
    ]);
    const currentMonthRentStatus = rentStatusResult.rows[0];
    const rentStatus = currentMonthRentStatus
      ? currentMonthRentStatus.paymentstatus
      : "P";

    // Calculate total submitted rent
    const totalRentQuery = `
      SELECT COALESCE(SUM(submittedAmount), 0) AS totalSubmittedRent
      FROM TenantRentNotice
      WHERE tenantID = $1 AND propertyID = $2;
    `;
    const totalRentResult = await db.query(totalRentQuery, [
      tenantID,
      propertyID,
    ]);
    const totalSubmittedRent = totalRentResult.rows[0].totalsubmittedrent || 0;

    // Part 2: Retrieve property lease information
    const leaseQuery = `
      SELECT 
        pl.registeredByID AS registeredByID,
        CONCAT(uir.firstName, ' ', uir.lastName) AS registeredByName,
        pl.registeredByType AS registeredByType,
        TO_CHAR((pl.leaseCreatedOn + INTERVAL '1 month' * pl.leasedForMonths) , 'MM-YYYY') AS leaseEndsOn,
        pl.dueDate,
        pl.fine,
        pl.incrementPercentage,
        pl.incrementPeriod,
        pl.rent,
        pl.securityDeposit,
        pl.advancePayment,
        pl.advancePaymentForMonths
      FROM PropertyLease pl
      JOIN UserInformation uir ON pl.registeredByID = uir.id
      WHERE pl.propertyID = $1;
    `;
    const leaseResult = await db.query(leaseQuery, [propertyID]);
    const lease = leaseResult.rows[0];

    // Construct response object
    const propertyDetail = {
      header: {
        propertyAddress: header.propertyaddress,
        ownerName: header?.ownername,
        managerName: header?.managername || null,
        rentStatus: rentStatus,
        totalSubmittedRent: totalSubmittedRent,
      },
      body: {
        leaseInformation: lease || {},
      },
      buttons: {
        submitRentCollectionRequest: rentStatus === "Pending",
        submitVerificationRequest: rentStatus === "Pending",
      },
    };

    // Send the property detail response
    return res.status(200).json({
      propertyDetail: propertyDetail,
    });
  } catch (error) {
    console.error("Error fetching property detail for tenant:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch property detail for tenant.",
      message: error.message,
    });
  }
};
