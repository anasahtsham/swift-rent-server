import pg from "pg"; //postgress database
import cors from "cors";

//Connecting Database
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "swiftrent",
  password: "12345678",
  port: "5432",
});
db.connect();

import express from "express"; //express server
import bodyParser from "body-parser";
import morgan from "morgan"; //request logging tool

//finding out directory folder
import { dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));

console.log(__dirname);

//Initiating Express Server
const app = express();
app.use(cors());
const port = 3000;

//JSON Parser
app.use(express.json());

//Parser
app.use(bodyParser.urlencoded({ extended: true }));
//Request Logger
app.use(morgan("tiny"));

//API 0: Admin Login
app.post("/api/admin/login", async (req, res) => {
  //Inputs
  const { userName, password } = req.body;
    if (userName == "admin" && password == "admin") {
      return res.status(200).json({ success: true });
    } else {
      return res.status(400).json({ error: "Incorrect Credentials" });
    }    
});

// API 1: Login
app.post("/api/login", async (req, res) => {
  //Inputs
  const { emailOrPhone, password } = req.body;
  try {
    // Check if the email or number exists in the User table
    const userQuery = await db.query(
      "SELECT * FROM UserInformation WHERE email = $1 OR phone = $1",
      [emailOrPhone]
    );
    if (userQuery.rows.length === 0) {
      // User not found
      return res.status(401).json({ error: "Incorrect Credentials" });
    }

    const user = userQuery.rows[0];

    // Check if the provided password matches the stored password
    if (user.md5password !== password) {
      return res.status(401).json({ error: "Incorrect Credentials" });
    }

    // Determine the user type (Owner, Tenant, etc.) by checking other tables
    const ownerQuery = await db.query("SELECT * FROM Owner WHERE userID = $1", [
      user.id,
    ]);
    const tenantQuery = await db.query(
      "SELECT * FROM Tenant WHERE userID = $1",
      [user.id]
    );

    let ownerID = 0,
      tenantID = 0;
    let userID = user.id;

    if (ownerQuery.rows.length > 0) {
      ownerID = ownerQuery.rows[0].id;
    }
    if (tenantQuery.rows.length > 0) {
      tenantID = tenantQuery.rows[0].id;
    }

    // Return the user ID, userType, and success status
    return res.status(200).json({ userID, ownerID, tenantID, success: true });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// API 2: Signup Contact Verification
app.post("/api/signup-contact", async (req, res) => {
  //Inputs
  const { email, phone } = req.body;
  try {
    //Checking if the email & phone are unique
    const userQuery = await db.query(
      "SELECT * FROM UserInformation WHERE email = $1 OR phone = $2",
      [email, phone]
    );
    if (userQuery.rows.length > 0) {
      return res
        .status(420)
        .json({
          error: "These credentials are not available to existing accounts",
        });
    }
    //Returning Message
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error during verfication of contacts:", error);
    return res.status(500).json({ error: "Internal Server error" });
  }
});

// API 3: Register Account
app.post("/api/register-account", async (req, res) => {
  //Inputs
  const { userType, firstName, lastName, DOB, email, phone, password } =
    req.body;
  try {
    //Creating a new record in user table
    const userQuery = await db.query(
      "INSERT INTO UserInformation (firstname, lastname, dob, email, phone, md5password) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id;",
      [firstName, lastName, DOB, email, phone, password]
    );
    //Extracting userID
    const userID = userQuery.rows[0].id;
    //Create the type of user (Owner or Tenant)
    let ownerID = 0,
      tenantID = 0;
    if (userType === "owner") {
      const ownerQuery = await db.query(
        "INSERT INTO Owner (userID) VALUES ($1) RETURNING id;",
        [userID]
      );
      ownerID = ownerQuery.rows[0].id;
    } else {
      const tenantQuery = await db.query(
        "INSERT INTO Tenant (userID) VALUES ($1) RETURNING id;",
        [userID]
      );
      tenantID = tenantQuery.rows[0].id;
    }
    //Return userID, ownerID, tenantID, success status
    return res.status(200).json({ userID, ownerID, tenantID, success: true });
  } catch (error) {
    console.error("Error during registration of user:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// API 4: New Role Registration
app.post("/api/new-role-registration", async (req, res) => {
  //Inputs
  const { userID, userType } = req.body;
  try {
    //Creating new userType
    let ownerID = 0,
      tenantID = 0;
    if (userType === "owner") {
      const ownerQuery = await db.query(
        "INSERT INTO Owner (userID) VALUES ($1) RETURNING id;",
        [userID]
      );
      ownerID = ownerQuery.rows[0].id;
    } else {
      const tenantQuery = await db.query(
        "INSERT INTO Tenant (userID) VALUES ($1) RETURNING id;",
        [userID]
      );
      tenantID = tenantQuery.rows[0].id;
    }
    //Return userID, ownerID, tenantID, success status
    return res.status(200).json({ userID, ownerID, tenantID, success: true });
  } catch (error) {
    console.error("Error during new role registration:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// API 5: Change Password
app.post("/api/change-password", async (req, res) => {
  //Inputs
  const { userID, oldPassword, newPassword } = req.body;
  try {
    const userQuery = await db.query(
      "SELECT * FROM UserInformation WHERE id = $1",
      [userID]
    );
    if (userQuery.rows.length > 0) {
      if (userQuery.rows[0].md5password === oldPassword) {
        db.query("UPDATE userinformation SET md5password=$1 WHERE id = $2;", [
          newPassword,
          userID,
        ]);
        return res.status(200).json({ success: true });
      }
    }
    return res.status(400).json({ error: "Old Password Does not match" });
  } catch (error) {
    console.error("Error during changing password:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// API 6: Report A Bug
app.post("/api/report-bug", async (req, res) => {
  //Inputs
  const { userID, userType, bugType, bugDescription } = req.body;
  try {
    const userQuery = await db.query(
      "INSERT INTO ReportedBug (userID, userType, bugType, bugDescription) VALUES ($1,$2,$3,$4) ",
      [userID, userType, bugType, bugDescription]
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error during reporting a bug:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// API 7: Notification Analytics (Owner)
app.post("/api/notification-analytics", async (req, res) => {
  const { ownerID } = req.body;
  try {
    // Query for counting different types of notifications
    const query = `
            SELECT notificationType, COUNT(*) as count 
            FROM Notification 
            WHERE ownerID = $1 
            GROUP BY notificationType;
        `;
    const result = await db.query(query, [ownerID]);

    // Preparing the response
    let rentNotification = 0,
      tenantNotification = 0,
      managerNotification = 0;
    result.rows.forEach((row) => {
      switch (row.notificationtype) {
        case "RNT":
          rentNotification = parseInt(row.count);
          break;
        case "TNT":
          tenantNotification = parseInt(row.count);
          break;
        case "MGR":
          managerNotification = parseInt(row.count);
          break;
      }
    });

    res
      .status(200)
      .json({
        rentNotification,
        tenantNotification,
        managerNotification,
        success: true,
      });
  } catch (error) {
    console.error("Error during notification analytics:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// API 8: Notification List
app.post("/api/notification-list", async (req, res) => {
  const { ownerID } = req.body;
  try {
    // Query to get all notifications along with tenant names
    const query = `
            SELECT n.*, ui.firstName, ui.lastName 
            FROM Notification n
            JOIN Tenant t ON n.tenantID = t.id
            JOIN UserInformation ui ON t.userID = ui.id
            WHERE n.ownerID = $1
            ORDER BY n.id DESC;
        `;
    const notifications = await db.query(query, [ownerID]);

    // Check if notifications exist
    if (notifications.rows.length === 0) {
      return res.status(404).json({ error: "No notifications found" });
    }

    // Preparing the response
    const notificationList = notifications.rows.map((n) => ({
      notificationID: n.id,
      notificationType: n.notificationtype,
      tenantName: `${n.firstname} ${n.lastname}`,
      // Include other relevant notification details if needed
    }));

    res.status(200).json({ notificationList, success: true });
  } catch (error) {
    console.error("Error during notification list:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// API 9: Month Analytics
app.post("/api/month-analytics", async (req, res) => {
  const { ownerID } = req.body;
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
  const currentYear = currentDate.getFullYear();
  const monthName = getCurrentMonthName(currentMonth);

  try {
    // Query for totalProfit, totalProperty, totalReceived, pendingRent
    const profitQuery = `
            SELECT SUM(amount) as totalProfit
            FROM RentTransaction
            WHERE ownerID = $1 AND EXTRACT(MONTH FROM PaymentDateTime) = $2;
        `;
    const propertyQuery = `
            SELECT COUNT(*) as totalProperty
            FROM Property
            WHERE ownerID = $1 AND dueDate != '0';
        `;
    const receivedQuery = `
            SELECT COUNT(*) as totalReceived
            FROM RentTransaction
            WHERE ownerID = $1 AND EXTRACT(MONTH FROM PaymentDateTime) = $2;
        `;
    const pendingQuery = `
            SELECT COUNT(*) as pendingRent
            FROM Tenant t
            LEFT JOIN RentTransaction rt ON t.id = rt.tenantID
            WHERE t.rentedPropertyID IN (
                SELECT id FROM Property WHERE ownerID = $1 AND dueDate != '0'
            ) AND rt.id IS NULL;
        `;

    // Executing queries
    const totalProfitResult = await db.query(profitQuery, [
      ownerID,
      currentMonth,
    ]);
    const totalPropertyResult = await db.query(propertyQuery, [ownerID]);
    const totalReceivedResult = await db.query(receivedQuery, [
      ownerID,
      currentMonth,
    ]);
    const pendingRentResult = await db.query(pendingQuery, [ownerID]);

    // Preparing the response
    const response = {
      currentMonth: monthName,
      currentYear: currentYear,
      totalProfit: totalProfitResult.rows[0].totalprofit || 0,
      totalProperty: totalPropertyResult.rows[0].totalproperty || 0,
      totalReceived: totalReceivedResult.rows[0].totalreceived || 0,
      pendingRent: pendingRentResult.rows[0].pendingrent || 0,
      success: true,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error during month analytics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Helper function to get the current month name with the first character capitalized
function getCurrentMonthName(monthIndex) {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[monthIndex - 1]; // Subtract 1 because JavaScript months are 0-indexed
}

// API 10: Monthly Analytics
app.post("/api/monthly-analytics", async (req, res) => {
  const { ownerID } = req.body;
  try {
    // Query to find the first transaction date
    const firstTransactionQuery = `
            SELECT EXTRACT(YEAR FROM PaymentDateTime) as year, EXTRACT(MONTH FROM PaymentDateTime) as month
            FROM RentTransaction
            WHERE ownerID = $1
            ORDER BY PaymentDateTime ASC
            LIMIT 1;
        `;
    const firstTransactionResult = await db.query(firstTransactionQuery, [
      ownerID,
    ]);

    // Check if there is any transaction data
    if (firstTransactionResult.rows.length === 0) {
      return res.status(404).json({ error: "No transaction data found" });
    }

    // Preparing to loop through months
    const startYear = firstTransactionResult.rows[0].year;
    const startMonth = firstTransactionResult.rows[0].month;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // JavaScript months are 0-indexed
    let monthlyData = [];

    // Loop through each month
    for (let year = startYear; year <= currentYear; year++) {
      for (
        let month = year === startYear ? startMonth : 1;
        month <= (year === currentYear ? currentMonth : 12);
        month++
      ) {
        const monthQuery = `
                    SELECT SUM(amount) as profit
                    FROM RentTransaction
                    WHERE ownerID = $1 AND EXTRACT(YEAR FROM PaymentDateTime) = $2 AND EXTRACT(MONTH FROM PaymentDateTime) = $3;
                `;
        const monthResult = await db.query(monthQuery, [ownerID, year, month]);
        monthlyData.push({
          year: year,
          month: month,
          profit: monthResult.rows[0].profit || 0,
        });
      }
    }

    res.status(200).json({ monthlyData, success: true });
  } catch (error) {
    console.error("Error during monthly analytics:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// API 11: Add Property
app.post("/api/add-property", async (req, res) => {
  //Inputs
  const { ownerID, rent, dueDate, propertyAddress } = req.body;
  try {
    const propertyQuery = await db.query(
      `INSERT INTO 
        Property (ownerID, rent, dueDate, propertyAddress) 
        VALUES ($1,$2,$3,$4)
        RETURNING id;`,
      [ownerID, rent, dueDate, propertyAddress]
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error during adding properties:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// API 12: Property List
app.post("/api/property-list", async (req, res) => {
  const { ownerID } = req.body;
  try {
    // Query to get the properties
    const propertyQuery = `
            SELECT p.*, SUM(rt.amount) as totalProfit
            FROM Property p
            LEFT JOIN RentTransaction rt ON p.id = rt.propertyID
            WHERE p.ownerID = $1 AND p.dueDate != '0'
            GROUP BY p.id
            ORDER BY p.id;
        `;
    const properties = await db.query(propertyQuery, [ownerID]);

    // Check if properties exist
    if (properties.rows.length === 0) {
      return res.status(404).json({ error: "No properties found" });
    }

    // Preparing the response
    const propertyList = properties.rows.map((p) => ({
      propertyAddress: p.propertyaddress,
      totalProfit: p.totalprofit || 0,
      status: p.tenantid ? "On-rent" : "Vacant",
    }));

    res.status(200).json({ propertyList, success: true });
  } catch (error) {
    console.error("Error during property list:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// API 13: Admin - List of Owners
app.post("/api/admin/list-owners", async (req, res) => {
  try {
    // Query to get information about owners with DOB in YYYY-MM-DD format
    const ownersQuery = `
      SELECT
        CONCAT(ui.firstname, ' ', ui.lastname) AS ownerName,
        TO_CHAR(ui.dob, 'YYYY-MM-DD') AS dob, -- Fetch DOB in YYYY-MM-DD format
        ui.email AS email,
        ui.phone AS phone,
        o.id AS ownerID,
        ui.id AS userID
      FROM Owner o
      JOIN UserInformation ui ON o.userID = ui.id;
    `;
    const owners = await db.query(ownersQuery);

    res.status(200).json({ owners: owners.rows, success: true });
  } catch (error) {
    console.error("Error while fetching list of owners:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// API 14: Admin - List of Tenants
app.post("/api/admin/list-tenants", async (req, res) => {
  try {
    // Query to get information about tenants with DOB in YYYY-MM-DD format
    const tenantsQuery = `
      SELECT
        CONCAT(ui.firstname, ' ', ui.lastname) AS tenantName,
        TO_CHAR(ui.dob, 'YYYY-MM-DD') AS dob, -- Fetch DOB in YYYY-MM-DD format
        ui.email AS email,
        ui.phone AS phone,
        t.id AS tenantID,
        ui.id AS userID
      FROM Tenant t
      JOIN UserInformation ui ON t.userID = ui.id;
    `;
    const tenants = await db.query(tenantsQuery);

    res.status(200).json({ tenants: tenants.rows, success: true });
  } catch (error) {
    console.error("Error while fetching list of tenants:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// API 15: Admin - Delete Owner
app.delete("/api/admin/delete-owner", async (req, res) => {
  const { ownerID } = req.body; // Read ownerID from the request body
  try {
    // Delete the owner instance from the database
    const result = await db.query("DELETE FROM Owner WHERE id = $1", [ownerID]); 

    // Check if the deletion was successful
    if (result.rowCount === 1) {
      res.status(200).json({ success: true });
    } else {
      res.status(404).json({ error: "Owner not found" });
    }
  } catch (error) {
    console.error("Error while deleting owner:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// API 16: Admin - Delete Tenant
app.delete("/api/admin/delete-tenant", async (req, res) => {
  const { tenantID } = req.body; // Read tenantID from the request body
  try {
    // Delete the tenant instance from the database
    const result = await db.query("DELETE FROM Tenant WHERE id = $1", [tenantID]);

    // Check if the deletion was successful
    if (result.rowCount === 1) {
      res.status(200).json({ success: true });
    } else {
      res.status(404).json({ error: "Tenant not found" });
    }
  } catch (error) {
    console.error("Error while deleting tenant:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// API 17: Admin - Edit User
app.put("/api/admin/edit-user", async (req, res) => {
  const { userID, userName, DOB, email, phone } = req.body;
  
  // Extracting firstName and lastName from userName
  const spaceIndex = userName.indexOf(' ');
  const firstName = spaceIndex === -1 ? userName : userName.substring(0, spaceIndex);
  const lastName = spaceIndex === -1 ? '' : userName.substring(spaceIndex + 1);

  try {
    // Update owner information in the database
    await db.query(
      "UPDATE UserInformation SET firstname=$1, lastname=$2, dob=$3, email=$4, phone=$5 WHERE id = $6;",
      [firstName, lastName, DOB, email, phone, userID]
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error while editing owner:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// API 18: Owner Details
app.post("/api/owner-details", async (req, res) => {
  // Inputs
  const { ownerID } = req.body;

  try {
    // Query to fetch owner details based on ownerID
    const ownerDetailsQuery = `
      SELECT
        CONCAT(ui.firstName, ' ', ui.lastName) AS ownerName,
        ui.email AS email,
        ui.phone AS phone
      FROM Owner o
      JOIN UserInformation ui ON o.userID = ui.id
      WHERE o.id = $1;
    `;

    const ownerDetails = await db.query(ownerDetailsQuery, [ownerID]);

    // Check if owner details exist
    if (ownerDetails.rows.length === 0) {
      return res.status(404).json({ error: "Owner not found" });
    }

    // Extract owner details
    const { ownername, email, phone } = ownerDetails.rows[0];
    const ownerName = ownername;
    // Prepare and send the response
    res.status(200).json({ ownerName, email, phone, success: true });
  } catch (error) {
    console.error("Error while fetching owner details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// API 19: Owner Details
app.post("/api/tenant-details", async (req, res) => {
  // Inputs
  const { tenantID } = req.body;

  try {
    // Query to fetch owner details based on ownerID
    const tenantDetailsQuery = `
      SELECT
        CONCAT(ui.firstName, ' ', ui.lastName) AS tenantName,
        ui.email AS email,
        ui.phone AS phone
      FROM Tenant t
      JOIN UserInformation ui ON t.userID = ui.id
      WHERE t.id = $1;
    `;

    const tenantDetails = await db.query(tenantDetailsQuery, [tenantID]);

    // Check if owner details exist
    if (tenantDetails.rows.length === 0) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    // Extract owner details
    const { tenantname, email, phone } = tenantDetails.rows[0];
    const tenantName = tenantname;
    // Prepare and send the response
    res.status(200).json({ tenantName, email, phone, success: true });
  } catch (error) {
    console.error("Error while fetching tenant details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});