import db from "../../config/config.js";

// API 1: Home Analytics Page
export const homeAnalytics = async (req, res) => {
  try {
    const { ownerID } = req.body;

    // Get current month and year
    const currentDate = new Date();
    const currentMonth = ("0" + (currentDate.getMonth() + 1)).slice(-2);
    const currentYear = currentDate.getFullYear().toString();

    // Query to fetch pending rents
    const pendingRentsQuery = `
    SELECT 
        COUNT(DISTINCT trn.propertyID) AS totalProperties
    FROM 
        TenantRentNotice trn
    JOIN 
        Property prop ON trn.propertyID = prop.id
    WHERE 
        prop.ownerID = $1
        AND trn.tenantID IS NOT NULL
        AND (trn.paymentStatus = 'P' 
          OR trn.paymentStatus = 'T' 
          OR trn.paymentStatus = 'V')
        AND DATE_PART('month', trn.createdOn) = $2
        AND DATE_PART('year', trn.createdOn) = $3;  
    `;

    // Query to fetch paid rents
    const paidRentsQuery = `
    SELECT 
        COUNT(DISTINCT trn.propertyID) AS totalProperties
    FROM 
        TenantRentNotice trn
    JOIN 
        Property prop ON trn.propertyID = prop.id
    WHERE 
        prop.ownerID = $1
        AND trn.tenantID IS NOT NULL
        AND trn.paymentStatus = 'C'
        AND DATE_PART('month', trn.createdOn) = $2
        AND DATE_PART('year', trn.createdOn) = $3;
    `;

    // Query to fetch current month report
    const collectedAmountQuery = `
        SELECT 
          SUM(trn.collectedAmount) AS rentsCollected
        FROM OwnerRentTransaction trn
        JOIN Property prop ON trn.propertyID = prop.id
        WHERE prop.ownerID = $1
        AND DATE_PART('month', trn.collectedOn) = $2
        AND DATE_PART('year', trn.collectedOn) = $3;
    `;
    // returned money query
    const returnedMoneyQuery = `
      SELECT SUM(tl.moneyReturned) AS totalReturnedMoney
      FROM TerminateLease tl
      JOIN PropertyLease pl ON tl.propertyLeaseID = pl.id
      JOIN Property p ON pl.propertyID = p.id
      WHERE p.ownerID = $1
      AND DATE_PART('month', tl.terminationDate) = DATE_PART('month', CURRENT_DATE)
      AND DATE_PART('year', tl.terminationDate) = DATE_PART('year', CURRENT_DATE);
    `;
    const returnedMoneyResult = await db.query(returnedMoneyQuery, [ownerID]);
    const returnedMoney = returnedMoneyResult.rows[0].totalreturnedmoney || 0;

    const maintenanceCostQuery = `
        SELECT 
          SUM(mr.maintenanceCost) AS maintenanceCost
        FROM Property prop
        JOIN MaintenanceReport mr ON prop.id = mr.propertyID
        WHERE prop.ownerID = $1
        AND DATE_PART('month', mr.createdOn) = $2
        AND DATE_PART('year', mr.createdOn) = $3;
    `;
    const totalPropertiesQuery = `
        SELECT 
          COUNT(prop.id) AS totalProperties
        FROM Property prop
        WHERE prop.ownerID = $1;
    `;

    // Query to fetch past month reports list
    const pastMonthReportsQuery = `
        SELECT 
          id,
          TO_CHAR(currentDate, 'Mon YY') AS currentDate,
          rentCollected,
          maintenanceCost
        FROM MonthlyReportOwner
        WHERE ownerID = $1
        ORDER BY id DESC
      `;

    // Execute queries
    const pendingRentsResult = await db.query(pendingRentsQuery, [
      ownerID,
      currentMonth,
      currentYear,
    ]);
    const paidRentsResult = await db.query(paidRentsQuery, [
      ownerID,
      currentMonth,
      currentYear,
    ]);
    const pastMonthReportsResult = await db.query(pastMonthReportsQuery, [
      ownerID,
    ]);
    const currentCollectedAmountResult = await db.query(collectedAmountQuery, [
      ownerID,
      currentMonth,
      currentYear,
    ]);
    const currentMaintenanceCostResult = await db.query(maintenanceCostQuery, [
      ownerID,
      currentMonth,
      currentYear,
    ]);
    const totalPropertiesResult = await db.query(totalPropertiesQuery, [
      ownerID,
    ]);

    // Extract results
    const pendingRents = pendingRentsResult.rows;
    const paidRents = paidRentsResult.rows;
    const pastMonthReports = pastMonthReportsResult.rows;

    // Send the analytics as the response
    return res.status(200).json({
      pendingRents,
      paidRents,
      currentMonthReport: {
        rentscollected:
          currentCollectedAmountResult?.rows.length > 0
            ? currentCollectedAmountResult.rows[0].rentscollected -
              returnedMoney
            : null,
        maintenancecost:
          currentMaintenanceCostResult?.rows.length > 0
            ? currentMaintenanceCostResult.rows[0].maintenancecost
            : null,
        totalproperties:
          totalPropertiesResult.rows?.length > 0
            ? totalPropertiesResult.rows[0].totalproperties
            : "0",
      },
      pastMonthReports,
    });
  } catch (error) {
    console.error("Error fetching owner home analytics:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch owner home analytics.",
      message: error.message,
    });
  }
};

// API 2: Pending Rents List
export const pendingRentsList = async (req, res) => {
  try {
    const { ownerID } = req.body;

    // Get current month and year
    const currentDate = new Date();
    const currentMonth = ("0" + (currentDate.getMonth() + 1)).slice(-2);
    const currentYear = currentDate.getFullYear().toString();

    // Query to fetch pending rents
    const pendingRentsQuery = `
        SELECT
            trn.propertyID as id,
            trn.rentAmount,
            TO_CHAR(trn.createdOn, 'DD-MM-YYYY') as createdOn,
            ui.firstName || ' ' || ui.lastName as tenantName,
            prop.propertyAddress || ', ' || area.areaName || ', ' || city.cityName as propertyAddress
        FROM 
            TenantRentNotice trn
        JOIN 
            Property prop ON trn.propertyID = prop.id
        JOIN 
            UserInformation ui ON trn.tenantID = ui.id
        JOIN 
            Area area ON prop.areaID = area.id
        JOIN 
            City city ON area.cityID = city.id
        WHERE 
            prop.ownerID = $1
            AND trn.tenantID IS NOT NULL
            AND (trn.paymentStatus = 'P' 
              OR trn.paymentStatus = 'T' 
              OR trn.paymentStatus = 'V')
            AND DATE_PART('month', trn.createdOn) = $2
            AND DATE_PART('year', trn.createdOn) = $3
        ORDER BY trn.id DESC;
    `;

    // Execute query
    const pendingRentsResult = await db.query(pendingRentsQuery, [
      ownerID,
      currentMonth,
      currentYear,
    ]);

    // Extract results
    const pendingRents = pendingRentsResult.rows;

    // Send the analytics as the response
    return res.status(200).json({
      pendingRents,
    });
  } catch (error) {
    console.error("Error fetching owner pending rents:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch owner pending rents.",
      message: error.message,
    });
  }
};

// API 3: Paid Rents List
export const paidRentsList = async (req, res) => {
  try {
    const { ownerID } = req.body;

    // Get current month and year
    const currentDate = new Date();
    const currentMonth = ("0" + (currentDate.getMonth() + 1)).slice(-2);
    const currentYear = currentDate.getFullYear().toString();

    // Query to fetch paid rents
    const paidRentsQuery = `
        SELECT
            trn.propertyID as id,
            trn.submittedAmount as rentAmount,
            TO_CHAR(trn.createdOn, 'DD-MM-YYYY') as createdOn,
            ui.firstName || ' ' || ui.lastName as tenantName,
            prop.propertyAddress || ', ' || area.areaName || ', ' || city.cityName as propertyAddress
        FROM 
            TenantRentNotice trn
        JOIN 
            Property prop ON trn.propertyID = prop.id
        JOIN 
            UserInformation ui ON trn.tenantID = ui.id
        JOIN 
            Area area ON prop.areaID = area.id
        JOIN 
            City city ON area.cityID = city.id
        WHERE 
            prop.ownerID = $1
            AND trn.tenantID IS NOT NULL
            AND trn.paymentStatus = 'C'
            AND DATE_PART('month', trn.createdOn) = $2
            AND DATE_PART('year', trn.createdOn) = $3
        ORDER BY trn.id DESC;
    `;

    // Execute query
    const paidRentsResult = await db.query(paidRentsQuery, [
      ownerID,
      currentMonth,
      currentYear,
    ]);

    // Extract results
    const paidRents = paidRentsResult.rows;

    // Send the analytics as the response
    return res.status(200).json({
      paidRents,
    });
  } catch (error) {
    console.error("Error fetching owner paid rents:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch owner paid rents.",
      message: error.message,
    });
  }
};

// API 4: Detailed Analytics
export const detailedAnalytics = async (req, res) => {
  try {
    const { ownerID } = req.body;

    // Get current month and year
    const currentDate = new Date();
    const currentMonth = ("0" + (currentDate.getMonth() + 1)).slice(-2);
    const currentYear = currentDate.getFullYear().toString();

    // Query to fetch rents collected for current month
    const rentsCollectedCurrentMonthQuery = `
        SELECT 
          SUM(trn.collectedAmount) AS rentsCollected
        FROM OwnerRentTransaction trn
        JOIN Property prop ON trn.propertyID = prop.id
        WHERE prop.ownerID = $1
        AND DATE_PART('month', trn.collectedOn) = $2
        AND DATE_PART('year', trn.collectedOn) = $3;
    `;
    const moneyReturnedQuery = `
    SELECT 
      COALESCE(SUM(moneyReturned), 0) AS moneyReturned
    FROM TerminateLease term
    WHERE DATE_PART('month', term.terminationDate) = $2
    AND DATE_PART('year', term.terminationDate) = $3
    AND term.ownerID = $1;
`;

    // Query to fetch maintenance costs for current month
    const maintenanceCostsCurrentMonthQuery = `
        SELECT 
          SUM(mr.maintenanceCost) AS maintenanceCosts
        FROM MaintenanceReport mr
        JOIN Property prop ON mr.propertyID = prop.id
        WHERE prop.ownerID = $1
        AND DATE_PART('month', mr.createdOn) = $2
        AND DATE_PART('year', mr.createdOn) = $3;
      `;

    // Query to fetch monthly report data for past 11 months
    const pastMonthReportsQuery = `
        SELECT 
          TO_CHAR(currentDate, 'Mon') AS month,
          rentCollected,
          maintenanceCost
        FROM MonthlyReportOwner
        WHERE ownerID = $1
        ORDER BY currentDate DESC
        LIMIT 11;
      `;

    // Query to fetch properties status
    const propertiesStatusQuery = `
        SELECT 
          COUNT(*) AS totalRegisteredProperties,
          COUNT(CASE WHEN tenantID IS NOT NULL THEN 1 END) AS totalPropertiesOnRent,
          COUNT(CASE WHEN tenantID IS NULL THEN 1 END) AS vacantProperties,
          COUNT(CASE WHEN managerID IS NOT NULL THEN 1 END) AS managedProperties
        FROM Property
        WHERE ownerID = $1
        AND propertyStatus != 'D';
      `;

    // Query to fetch maintenance statistics
    const maintenanceStatisticsQuery = `
        SELECT 
          COUNT(*) AS totalMaintenanceRequests,
          SUM(maintenanceCost) AS totalCostOfMaintenance
        FROM MaintenanceReport
        WHERE propertyID IN (
          SELECT id FROM Property WHERE ownerID = $1
        );
      `;

    // Query to fetch complaints statistics
    const complaintsStatisticsQuery = `
        SELECT 
          COUNT(CASE WHEN receiverType IN ('O', 'M') THEN 1 END) AS totalComplaintsReceived,
          COUNT(CASE WHEN senderType IN ('O', 'M') THEN 1 END) AS totalComplaintsSent,
          COUNT(CASE WHEN complaintStatus = 'P' AND receiverType IN ('O', 'M') THEN 1 END) AS totalPendingReceivedComplaints,
          COUNT(CASE WHEN complaintStatus = 'A' AND receiverType IN ('O', 'M') THEN 1 END) AS totalResolvedReceivedComplaints
        FROM Complaint
        WHERE (receiverType = 'O' OR receiverType = 'M') AND receiverID = $1;
      `;

    // Execute queries
    const rentsCollectedCurrentMonthResult = await db.query(
      rentsCollectedCurrentMonthQuery,
      [ownerID, currentMonth, currentYear]
    );
    const moneyReturnedResult = await db.query(moneyReturnedQuery, [
      ownerID,
      currentMonth,
      currentYear,
    ]);
    const maintenanceCostsCurrentMonthResult = await db.query(
      maintenanceCostsCurrentMonthQuery,
      [ownerID, currentMonth, currentYear]
    );
    const pastMonthReportsResult = await db.query(pastMonthReportsQuery, [
      ownerID,
    ]);
    const propertiesStatusResult = await db.query(propertiesStatusQuery, [
      ownerID,
    ]);
    const maintenanceStatisticsResult = await db.query(
      maintenanceStatisticsQuery,
      [ownerID]
    );
    const complaintsStatisticsResult = await db.query(
      complaintsStatisticsQuery,
      [ownerID]
    );

    // Extract results
    const rentsCollectedCurrentMonth =
      (rentsCollectedCurrentMonthResult.rows[0].rentscollected || 0) -
      (moneyReturnedResult.rows[0].moneyreturned || 0);
    const maintenanceCostsCurrentMonth =
      maintenanceCostsCurrentMonthResult.rows[0].maintenancecosts || 0;
    const pastMonthReports = pastMonthReportsResult.rows;
    const {
      totalregisteredproperties,
      totalpropertiesonrent,
      vacantproperties,
      managedproperties,
    } = propertiesStatusResult.rows[0];
    const { totalmaintenancerequests, totalcostofmaintenance } =
      maintenanceStatisticsResult.rows[0];
    const {
      totalcomplaintsreceived,
      totalcomplaintssent,
      totalpendingreceivedcomplaints,
      totalresolvedreceivedcomplaints,
    } = complaintsStatisticsResult.rows[0];

    // Prepare graph data
    // Prepare graph data
    const defaultArray = new Array(11).fill(0);
    const monthNames = [];
    for (let i = 0; i < 11; i++) {
      const date = new Date(currentYear, currentMonth - i - 2, 1);
      const monthName = date.toLocaleString("default", { month: "short" });
      monthNames.push(monthName);
    }

    const totalCollectedRents = defaultArray
      .map((_, index) =>
        pastMonthReports[index]
          ? parseInt(pastMonthReports[index].rentcollected)
          : 0
      )
      .reverse();

    const totalMaintenanceCosts = defaultArray
      .map((_, index) =>
        pastMonthReports[index]
          ? parseInt(pastMonthReports[index].maintenancecost)
          : 0
      )
      .reverse();

    // Append current month data to graph data
    monthNames.push(currentDate.toLocaleString("default", { month: "long" }));
    totalCollectedRents.push(parseInt(rentsCollectedCurrentMonth));
    totalMaintenanceCosts.push(parseInt(maintenanceCostsCurrentMonth));

    // Send the analytics as the response
    return res.status(200).json({
      totalCollectedRents,
      totalMaintenanceCosts,
      monthNames,
      propertiesStatus: {
        totalregisteredproperties,
        totalpropertiesonrent,
        vacantproperties,
        managedproperties,
      },
      maintenanceStatistics: {
        totalmaintenancerequests,
        totalcostofmaintenance,
      },
      complaintsStatistics: {
        totalcomplaintsreceived,
        totalcomplaintssent,
        totalpendingreceivedcomplaints,
        totalresolvedreceivedcomplaints,
      },
    });
  } catch (error) {
    console.error("Error fetching complete analytics:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch complete analytics.",
      message: error.message,
    });
  }
};
