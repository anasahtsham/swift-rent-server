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
                      ORDER BY areaName`;
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
      propertyAddress,
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
      hasElectricity,
      hasGas,
      hasLift,
      hasPrayerRoom,
      hasRoofAccess,
      hasSafetyExit,
      hasSeperateMeter,
      hasServantRoom,
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
              hasElectricity,
              hasGas,
              hasLift,
              hasPrayerRoom,
              hasRoofAccess,
              hasSafetyExit,
              hasSeperateMeter,
              hasServantRoom,
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
      hasElectricity,
      hasGas,
      hasLift,
      hasPrayerRoom,
      hasRoofAccess,
      hasSafetyExit,
      hasSeperateMeter,
      hasServantRoom,
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
              propertyAddress,
              propertyAmenityID,
              propertyStatus
            ) VALUES ($1, $2, $3, $4, $5, 'V');
          `;
    const propertyValues = [
      userID,
      areaID,
      propertySubTypeID,
      propertyAddress,
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
        p.id,
        CONCAT(
          p.propertyAddress, ', ', a.areaName, ', ', c.cityName
        ) AS address,
        CONCAT(t.firstName, ' ', t.lastName) AS tenantName,
        CONCAT(m.firstName, ' ', m.lastName) AS managerName,
        p.propertyStatus
      FROM Property p
      JOIN Area a ON p.areaID = a.id
      JOIN City c ON a.cityID = c.id
      LEFT JOIN UserInformation t ON p.tenantID = t.id
      LEFT JOIN UserInformation m ON p.managerID = m.id
      WHERE p.ownerID = $1
      ORDER BY p.id DESC
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

//API 4: Register Tenant
export const registerTenant = async (req, res) => {
  const {
    propertyID,
    phone,
    registeredByID,
    registeredByType,
    incrementPercentage,
    incrementPeriod,
    rent,
    securityDeposit,
    advancePayment,
    advancePaymentForMonths,
    dueDate,
    fine,
    leasedForMonths,
  } = req.body;

  try {
    // Check if the phone number is of a tenant, see if isTenant is true
    const isTenantQuery = await db.query(
      `SELECT isTenant, id FROM UserInformation WHERE phone = $1`,
      [phone]
    );

    if (isTenantQuery.rows.length === 0) {
      return res.status(404).json({ error: "User not registered as Tenant" });
    }

    //make sure that there are no other pending leases or active leases against this propertyID in the database.
    const leaseQuery = await db.query(
      `SELECT leaseStatus FROM PropertyLease WHERE propertyID = $1 ORDER BY id DESC`,
      [propertyID]
    );
    //Check if lease status is P = Pending or A = Active
    if (leaseQuery.rows.length > 0) {
      if (leaseQuery.rows[0].leasestatus === "P") {
        return res.status(400).json({
          error: "There is already a pending lease agreement for this property",
        });
      } else if (leaseQuery.rows[0].leasestatus === "A") {
        return res.status(400).json({
          error: "There is already an active lease agreement for this property",
        });
      }
    }

    // Check if there is a manager registered to the property
    const propertyQuery = await db.query(
      `SELECT 
        CONCAT(
          p.propertyAddress, ', ', a.areaName, ', ', c.cityName
        ) AS address,
        p.ownerID
      FROM Property p
      JOIN Area a ON p.areaID = a.id
      JOIN City c ON a.cityID = c.id
      WHERE p.id = $1`,
      [propertyID]
    );

    if (propertyQuery.rows.length === 0) {
      return res.status(404).json({ error: "Property not found" });
    }

    const { address, ownerid } = propertyQuery.rows[0];

    //Check if tenantID is same as the ownerID on the property
    if (isTenantQuery.rows.length > 0) {
      if (isTenantQuery.rows[0].id === ownerid) {
        return res.status(400).json({
          error: "Cannot register owner as a tenant on his property!",
        });
      }
    }

    // Find the tenantID using the provided phone number
    const tenantQuery = await db.query(
      "SELECT id FROM UserInformation WHERE phone = $1",
      [phone]
    );

    if (tenantQuery.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Tenant not found, Please check the number!" });
    }

    const tenantID = tenantQuery.rows[0].id;

    //TeanatID cannot be same as ownerID
    if (tenantID === registeredByID) {
      return res.status(400).json({
        error: "Cannot register yourself as a tenant on his own property!",
      });
    }

    // Set lease status to 'P'
    const leaseStatus = "P";

    // Insert data into the property lease table
    await db.query(
      `INSERT INTO PropertyLease (
        propertyID, tenantID, registeredByType, registeredByID, leaseStatus,
        incrementPercentage, incrementPeriod, rent, securityDeposit, advancePayment,
        advancePaymentForMonths, dueDate, fine, leasedForMonths
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        propertyID,
        tenantID,
        registeredByType,
        registeredByID,
        leaseStatus,
        incrementPercentage,
        incrementPeriod,
        rent,
        securityDeposit,
        advancePayment,
        advancePaymentForMonths,
        dueDate,
        fine,
        leasedForMonths,
      ]
    );

    // Get the name of the registrar from UserInformation table
    const registrarQuery = await db.query(
      "SELECT firstName, lastName FROM UserInformation WHERE id = $1",
      [registeredByID]
    );

    const registrar =
      registrarQuery.rows[0].firstname + " " + registrarQuery.rows[0].lastname;

    const notificationText = `Approve lease agreement for: ${address}`;

    // Create a notification for the tenant and also check if it was successfully created
    await db.query(
      `INSERT INTO UserNotification (
        userID, userType, senderID, senderType, notificationText, notificationType
      ) VALUES ($1, 'T', $2, $3, $4, 'L')`,
      [tenantID, registeredByID, registeredByType, notificationText]
    );

    res.status(200).json({ success: "Request sent to tenant successfully" });
  } catch (error) {
    console.error("Error registering tenant:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

//API 5: Terminate Lease Agreement
export const terminateTenant = async (req, res) => {
  try {
    const { ownerID, propertyID, moneyReturned, terminationReason } = req.body;
    console.log(req.body);

    // Money returned should be equal or greater than 0
    if (moneyReturned < 0) {
      return res.status(400).json({
        success: "Money returned cannot be less than 0.",
      });
    }

    // Check if there is a tenant for the property
    const propertyQuery = `
      SELECT tenantID
      FROM Property
      WHERE id = $1;
    `;
    const propertyResult = await db.query(propertyQuery, [propertyID]);
    const tenantID = propertyResult.rows[0].tenantid;

    if (!tenantID) {
      return res.status(400).json({
        success: "Cannot terminate lease. No tenant found for the property.",
      });
    }

    // Check if there are pending or to collect rent notices for the tenant
    const rentNoticeQuery = `
      SELECT id, paymentStatus
      FROM TenantRentNotice
      WHERE tenantID = $1 AND EXTRACT(MONTH FROM createdOn) = EXTRACT(MONTH FROM CURRENT_TIMESTAMP)
      AND EXTRACT(YEAR FROM createdOn) = EXTRACT(YEAR FROM CURRENT_TIMESTAMP)
      AND paymentStatus = 'V' AND propertyID = $2
      ORDER BY createdOn DESC;
    `;
    const rentNoticeResult = await db.query(rentNoticeQuery, [
      tenantID,
      propertyID,
    ]);

    if (rentNoticeResult.rows.length > 0) {
      console.log(rentNoticeResult.rows);
      // There are pending or to collect rent notices, cannot terminate lease
      return res.status(400).json({
        success: "Cannot terminate lease. Pending rent notices exist.",
      });
    }

    // Get PropertyLease ID from PropertyLease table using propertyID and tenantID and propertyStatus = 'A'
    const propertyLeaseIDQuery = `
      SELECT id
      FROM PropertyLease
      WHERE propertyID = $1 AND tenantID = $2 AND leaseStatus = 'A';
    `;
    const propertyLeaseIDResult = await db.query(propertyLeaseIDQuery, [
      propertyID,
      tenantID,
    ]);
    const propertyLeaseID = propertyLeaseIDResult.rows[0].id;

    // Create TerminateLease entry
    const createTerminateLeaseQuery = `
      INSERT INTO TerminateLease (propertyLeaseID, terminationGeneratedBy, terminationDate, moneyReturned, terminationReason)
      VALUES (
        $1,
        'O',
        CURRENT_TIMESTAMP,
        $2,
        $3
      );
    `;
    await db.query(createTerminateLeaseQuery, [
      propertyLeaseID,
      moneyReturned,
      terminationReason,
    ]);

    // Update TenantRentNotice table
    const updateRentNoticeQuery = `
        UPDATE TenantRentNotice
        SET paymentStatus = 'S'
        WHERE tenantID = $1 AND EXTRACT(MONTH FROM createdOn) = EXTRACT(MONTH FROM CURRENT_TIMESTAMP)
        AND EXTRACT(YEAR FROM createdOn) = EXTRACT(YEAR FROM CURRENT_TIMESTAMP)
        AND (paymentStatus = 'P' OR paymentStatus = 'T') AND propertyID = $2;
      `;
    await db.query(updateRentNoticeQuery, [tenantID, propertyID]);

    // Update Property table
    const updatePropertyQuery = `
        UPDATE Property
        SET tenantID = NULL, propertyStatus = 'V'
        WHERE id = $1;
      `;
    await db.query(updatePropertyQuery, [propertyID]);

    // Update PropertyLease table
    const updateLeaseQuery = `
        UPDATE PropertyLease
        SET leaseStatus = 'T'
        WHERE propertyID = $1 AND tenantID = $2 AND leaseStatus = 'A';
      `;
    await db.query(updateLeaseQuery, [propertyID, tenantID]);

    // Get full property address from property, area and city table
    const propertyAddressQuery = `
      SELECT CONCAT(p.propertyAddress, ', ', a.areaName, ', ', c.cityName) AS address
      FROM Property p
      JOIN Area a ON p.areaID = a.id
      JOIN City c ON a.cityID = c.id
      WHERE p.id = $1;
    `;
    const propertyAddressResult = await db.query(propertyAddressQuery, [
      propertyID,
    ]);
    const propertyAddress = propertyAddressResult.rows[0].address;

    // Send notifications
    const notificationMessageTenant = `Your lease for property ${propertyAddress} has been terminated. Reason: ${terminationReason}`;
    const notificationQuery = `
      INSERT INTO UserNotification (userID, userType, senderID, senderType, notificationText, notificationType)
      VALUES ($1, 'T', $2, 'O', $3, 'L');
    `;
    await db.query(notificationQuery, [
      tenantID,
      ownerID,
      notificationMessageTenant,
    ]);

    // Send notification to manager, if present
    const managerIDQuery = `
      SELECT managerID
      FROM Property
      WHERE id = $1;
    `;
    const managerIDResult = await db.query(managerIDQuery, [propertyID]);
    const managerID = managerIDResult.rows[0].managerid;

    const notificationMessageManager = `Lease for property ${propertyAddress} has been terminated for the tenant. Reason: ${terminationReason}`;

    if (managerID) {
      await db.query(notificationQuery, [
        managerID,
        ownerID,
        notificationMessageManager,
      ]);
    }

    if (managerID) {
      // Update the rating ratingEndDate of rating Tenant to Manager
      const updateOwnerManagerRatingQuery = `
        UPDATE Rating
        SET ratingEndDate = CURRENT_DATE
        WHERE propertyID = $1
          AND userID = $2
          AND userType = 'T'
          AND ratedByID = $3
          AND ratedByType = 'O';
      `;
      await db.query(updateOwnerManagerRatingQuery, [
        propertyID,
        tenantID,
        ownerID,
      ]);

      // Update the rating ratingEndDate of rating Manager to Tenant
      const updateManagerTenantRatingQuery = `
        UPDATE Rating
        SET ratingEndDate = CURRENT_DATE
        WHERE propertyID = $1
          AND userID = $2
          AND userType = 'M'
          AND ratedByID = $3
          AND ratedByType = 'T';
      `;
      await db.query(updateManagerTenantRatingQuery, [
        propertyID,
        managerID,
        tenantID,
      ]);
    }

    // Update the rating ratingEndDate of rating Owner to Tenant
    const updateOwnerTenantRatingQuery = `
      UPDATE Rating
      SET ratingEndDate = CURRENT_DATE
      WHERE propertyID = $1
        AND userID = $2
        AND userType = 'O'
        AND ratedByID = $3
        AND ratedByType = 'T';
    `;
    await db.query(updateOwnerTenantRatingQuery, [
      propertyID,
      ownerID,
      tenantID,
    ]);

    // Update the rating ratingEndDate of rating Tenant to Owner
    const updateTenantOwnerRatingQuery = `
      UPDATE Rating
      SET ratingEndDate = CURRENT_DATE
      WHERE propertyID = $1
        AND userID = $2
        AND userType = 'T'
        AND ratedByID = $3
        AND ratedByType = 'O';
    `;
    await db.query(updateTenantOwnerRatingQuery, [
      propertyID,
      tenantID,
      ownerID,
    ]);

    return res
      .status(200)
      .json({ success: true, message: "Lease terminated successfully." });
  } catch (error) {
    console.error("Error terminating lease:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to terminate lease." });
  }
};

//API 6: Property Details
export const fetchPropertyDetail = async (req, res) => {
  try {
    // Extract ownerID and propertyID from request parameters
    const { ownerID, propertyID } = req.body;

    // Part 1: Retrieve complete property address (address + area + city) and basic information
    const propertyQuery = `
      SELECT CONCAT(
        p.propertyAddress, ', ', a.areaName, ', ', c.cityName
      ) AS propertyAddress, 
      TO_CHAR(p.registeredOn, 'DD-MM-YYYY') AS registeredOn, 
      p.onRentDays, 
      p.offRentDays
      FROM Property p
      JOIN Area a ON p.areaID = a.id
      JOIN City c ON a.cityID = c.id
      WHERE p.ownerID = $1 AND p.id = $2;
    `;
    const propertyResult = await db.query(propertyQuery, [ownerID, propertyID]);
    const property = propertyResult.rows[0];

    // Part 2: Retrieve lease information
    const leaseQuery = `
      SELECT pl.tenantID, ui.firstName || ' ' || ui.lastName AS tenantName,
             pl.registeredByID, ui2.firstName || ' ' || ui2.lastName AS registeredByName,
             pl.registeredByType, 
             TO_CHAR((pl.leaseCreatedOn + INTERVAL '1 month' * pl.leasedForMonths) , 'MM-YYYY') AS leaseEndsOn, 
             pl.dueDate, pl.fine, pl.incrementPercentage,
             pl.incrementPeriod, pl.rent, pl.securityDeposit, pl.advancePayment,
             pl.advancePaymentForMonths
      FROM PropertyLease pl
      INNER JOIN UserInformation ui ON pl.tenantID = ui.id
      INNER JOIN UserInformation ui2 ON pl.registeredByID = ui2.id
      WHERE pl.propertyID = $1;
    `;
    const leaseResult = await db.query(leaseQuery, [propertyID]);
    const lease = leaseResult.rows[0];

    // Part 3: Retrieve manager contract information
    const managerContractQuery = `
      SELECT mhr.managerID, ui3.firstName || ' ' || ui3.lastName AS managerName,
             mhr.salaryPaymentType, mhr.salaryFixed, mhr.salaryPercentage,
             mhr.whoBringsTenant, mhr.rent, mhr.specialCondition, mhr.needHelpWithLegalWork
      FROM ManagerHireRequest mhr
      INNER JOIN UserInformation ui3 ON mhr.managerID = ui3.id
      WHERE mhr.propertyID = $1;
    `;
    const managerContractResult = await db.query(managerContractQuery, [
      propertyID,
    ]);
    const managerContract = managerContractResult.rows[0];

    // Part 4: Retrieve current month's rent status
    const currentMonthRentStatusQuery = `
      SELECT tn.paymentStatus AS tenantPaymentStatus,
             mrc.paymentStatus AS managerPaymentStatus
      FROM TenantRentNotice tn
      LEFT JOIN ManagerRentCollection mrc ON tn.id = mrc.tenantRentNoticeID
      WHERE tn.propertyID = $1 AND 
            EXTRACT(MONTH FROM tn.createdOn) = EXTRACT(MONTH FROM CURRENT_TIMESTAMP) AND
            EXTRACT(YEAR FROM tn.createdOn) = EXTRACT(YEAR FROM CURRENT_TIMESTAMP);
    `;
    const currentMonthRentStatusResult = await db.query(
      currentMonthRentStatusQuery,
      [propertyID]
    );
    const currentMonthRentStatus = currentMonthRentStatusResult.rows[0];

    // Part 5: Calculate total maintenance costs for the property
    const maintenanceCostQuery = `
      SELECT SUM(maintenanceCost) AS totalMaintenanceCost
      FROM MaintenanceReport
      WHERE propertyID = $1;
    `;
    const maintenanceCostResult = await db.query(maintenanceCostQuery, [
      propertyID,
    ]);
    const totalMaintenanceCost = parseInt(
      maintenanceCostResult.rows[0].totalmaintenancecost || 0
    );

    // Part 6: Calculate total property revenue
    const totalRevenueQuery = `
      SELECT SUM(collectedAmount) AS totalCollectedAmount
      FROM OwnerRentTransaction
      WHERE propertyID = $1;
    `;
    const totalRevenueResult = await db.query(totalRevenueQuery, [propertyID]);
    const totalCollectedAmount =
      totalRevenueResult.rows[0].totalcollectedamount || 0;

    // Calculate total revenue after deducting returned money from terminated leases
    const returnedMoneyQuery = `
      SELECT SUM(moneyReturned) AS totalReturnedMoney
      FROM TerminateLease
      WHERE propertyLeaseID IN (
        SELECT id FROM PropertyLease WHERE propertyID = $1
      );
    `;
    const returnedMoneyResult = await db.query(returnedMoneyQuery, [
      propertyID,
    ]);
    const totalReturnedMoney =
      returnedMoneyResult.rows[0].totalreturnedmoney || 0;
    const totalPropertyRevenue = totalCollectedAmount - totalReturnedMoney;

    //check for manager offers
    const managerOfferQuery = `
      SELECT managerStatus
      FROM ManagerHireRequest
      WHERE propertyID = $1 AND managerStatus = 'P';
    `;
    const managerOfferResult = await db.query(managerOfferQuery, [propertyID]);
    const managerOffers = managerOfferResult.rows.length > 0;

    // Combine all retrieved information into a response object
    const propertyDetail = {
      header: {
        propertyAddress: property?.propertyaddress,
        rentStatus: {
          tenantPaymentStatus:
            currentMonthRentStatus?.tenantpaymentstatus || "Not Rented",
          managerPaymentStatus:
            currentMonthRentStatus?.managerpaymentstatus || null,
        },
        totalMaintenanceCost: totalMaintenanceCost,
        totalPropertyRevenue: totalPropertyRevenue,
      },
      body: {
        propertyInformation: {
          registeredOn: property?.registeredon,
          onRentDays: property?.onrentdays || 0,
          offRentDays: property?.offrentdays || 0,
        },
        leaseInformation: lease || {}, // Lease may not exist if property is vacant
        managerContract: managerContract || {}, // Manager contract may not exist if property is vacant
      },
      buttons: {
        managerOffers: managerOffers,
        collectRent:
          currentMonthRentStatus?.tenantpaymentstatus === "T" ||
          currentMonthRentStatus?.managerpaymentstatus === "P",
        verifyOnlineRent:
          currentMonthRentStatus?.tenantpaymentstatus === "V" ||
          (currentMonthRentStatus?.managerpaymentstatus === "P" &&
            currentMonthRentStatus?.tenantpaymentstatus !== "C"),
      },
    };

    // Send the property detail response
    return res.status(200).json({
      propertyDetail: propertyDetail,
    });
  } catch (error) {
    console.error("Error fetching property detail:", error);
    return res.status(500).json({
      success: "Failed to fetch property detail.",
      error: error.message,
    });
  }
};
