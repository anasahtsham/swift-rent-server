import db from "../../config/config.js";

//API 1: View Managed Properties List
export const viewManagedProperties = async (req, res) => {
  try {
    // Extract managerID from request body
    const { managerID } = req.body;

    // Query to fetch managed properties along with relevant details
    // Query to fetch managed properties along with relevant details
    const query = `
      SELECT
        P.id,
        CONCAT(P.propertyAddress, ', ', AA.areaName, ', ', CC.cityName) AS address,
        
        CONCAT(UIO.firstName, ' ', UIO.lastName) AS ownerName,
        CASE
          WHEN P.tenantID IS NOT NULL THEN CONCAT(UIT.firstName, ' ', UIT.lastName)
          ELSE NULL
        END AS tenantName, 
        P.propertyStatus    
      FROM Property P
      JOIN UserInformation UIM ON P.managerID = UIM.id
      JOIN UserInformation UIO ON P.ownerID = UIO.id
      LEFT JOIN UserInformation UIT ON P.tenantID = UIT.id
      JOIN Area AA ON P.areaID = AA.id
      JOIN City CC ON AA.cityID = CC.id
      WHERE P.managerID = $1
      ORDER BY P.id DESC;
      `;

    // Execute the query to fetch managed properties
    const managedProperties = await db.query(query, [managerID]);

    // Send the list of managed properties as response
    res.status(200).json(managedProperties.rows);
  } catch (error) {
    console.error("Error viewing managed properties:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to view managed properties." });
  }
};

//API 2: View Property Details
export const fetchPropertyDetail = async (req, res) => {
  try {
    // Extract managerID and propertyID from request parameters
    const { managerID, propertyID } = req.body;

    // Part 1: Retrieve property address and basic information
    const propertyQuery = `
      SELECT CONCAT(
        p.propertyAddress, ', ', a.areaName, ', ', c.cityName
      ) AS propertyAddress, 
      CONCAT(ui.firstName, ' ', ui.lastName) AS ownerName
      FROM Property p
      JOIN Area a ON p.areaID = a.id
      JOIN City c ON a.cityID = c.id
      JOIN UserInformation ui ON p.ownerID = ui.id
      WHERE p.managerID = $1 AND p.id = $2;
    `;
    const propertyResult = await db.query(propertyQuery, [
      managerID,
      propertyID,
    ]);
    const property = propertyResult.rows[0];

    // Part 2: Retrieve current month's rent status
    const rentStatusQuery = `
      SELECT tn.paymentStatus
      FROM TenantRentNotice tn
      WHERE tn.propertyID = $1 AND 
            EXTRACT(MONTH FROM tn.createdOn) = EXTRACT(MONTH FROM CURRENT_TIMESTAMP) AND
            EXTRACT(YEAR FROM tn.createdOn) = EXTRACT(YEAR FROM CURRENT_TIMESTAMP);
    `;
    const rentStatusResult = await db.query(rentStatusQuery, [propertyID]);
    const rentStatus = rentStatusResult.rows[0];

    // Part 3: Calculate total income
    const totalIncomeQuery = `
      SELECT SUM(managersCut) AS totalIncome
      FROM ManagerRentCollection
      WHERE managerID = $1;
    `;
    const totalIncomeResult = await db.query(totalIncomeQuery, [managerID]);
    const totalIncome = totalIncomeResult.rows[0].totalincome || 0;

    // Part 4: Retrieve lease information
    const leaseQuery = `
      SELECT ui2.firstName || ' ' || ui2.lastName AS tenantName,
             ui3.firstName || ' ' || ui3.lastName AS registeredByName,
             TO_CHAR((pl.leaseCreatedOn + INTERVAL '1 month' * pl.leasedForMonths) , 'MM-YYYY') AS leaseEndsOn, 
             pl.dueDate, 
             pl.fine, 
             pl.incrementPercentage,
             pl.incrementPeriod, 
             pl.rent, 
             pl.securityDeposit, 
             pl.advancePayment,
             pl.advancePaymentForMonths, 
             pl.registeredByType
      FROM PropertyLease pl
      INNER JOIN UserInformation ui2 ON pl.tenantID = ui2.id
      INNER JOIN UserInformation ui3 ON pl.registeredByID = ui3.id
      WHERE pl.propertyID = $1;
    `;
    const leaseResult = await db.query(leaseQuery, [propertyID]);
    const lease = leaseResult.rows[0];

    // Part 5: Retrieve manager contract information
    const managerContractQuery = `
      SELECT salaryPaymentType, salaryFixed, salaryPercentage,
             whoBringsTenant, rent, specialCondition, needHelpWithLegalWork
      FROM ManagerHireRequest
      WHERE propertyID = $1 AND managerID = $2;
    `;
    const managerContractResult = await db.query(managerContractQuery, [
      propertyID,
      managerID,
    ]);
    const managerContract = managerContractResult.rows[0];

    // Combine all retrieved information into a response object
    const propertyDetail = {
      header: {
        propertyAddress: property.propertyaddress,
        ownerName: property.ownername,
        rentStatus: rentStatus
          ? rentStatus?.paymentstatus === "C"
            ? "Collected"
            : "Pending"
          : "Not Rented",
        totalIncome: totalIncome,
      },
      body: {
        leaseInformation: lease || {},
        myContract: managerContract || {},
      },
      buttons: {
        collectRent: rentStatus ? rentStatus?.paymentstatus === "T" : null,
        verifyOnlineRent: rentStatus ? rentStatus?.paymentstatus === "V" : null,
        submitVerificationRequest: rentStatus
          ? rentStatus?.paymentstatus === "P"
          : null,
      },
    };

    // Send the property detail response
    return res.status(200).json({
      propertyDetail: propertyDetail,
    });
  } catch (error) {
    console.error("Error fetching property detail for manager:", error);
    return res.status(500).json({
      success: "Failed to fetch property detail for manager.",
      error: error.message,
    });
  }
};
