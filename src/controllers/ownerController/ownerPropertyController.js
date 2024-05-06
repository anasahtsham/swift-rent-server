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
        t.firstName AS tenantName, 
        m.firstName AS managerName, 
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
      `SELECT isTenant FROM UserInformation WHERE phone = $1`,
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
        p.managerID AS managerID,
        p.ownerID AS ownerID
      FROM Property p
      JOIN Area a ON p.areaID = a.id
      JOIN City c ON a.cityID = c.id
      WHERE p.id = $1`,
      [propertyID]
    );

    if (propertyQuery.rows.length === 0) {
      return res.status(404).json({ error: "Property not found" });
    }

    const { managerid, address, ownerid } = propertyQuery.rows[0];

    // Set managerID in the property lease table if a manager is registered
    const registeredManagerID = managerid ? managerid : null;

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
        propertyID, tenantID, registeredByType, registeredByID, managerID, leaseStatus,
        incrementPercentage, incrementPeriod, rent, securityDeposit, advancePayment,
        advancePaymentForMonths, dueDate, fine, leasedForMonths
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        propertyID,
        tenantID,
        registeredByType,
        registeredByID,
        registeredManagerID,
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
