import pg from "pg"; //postgress database

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

//Initiating Express Server
const app = express();
app.use(express.json());
const port = 3000;

//Parser
app.use(bodyParser.urlencoded({ extended: true }));
//Request Logger
app.use(morgan("tiny"));

// API 1: Login
app.post('/api/login', async (req, res) => {
    //Inputs
    const { emailOrPhone, password } = req.body;
    try {
      // Check if the email or number exists in the User table
      const userQuery = await db.query('SELECT * FROM UserInformation WHERE email = $1 OR phone = $1', [emailOrPhone]);
      console.log(userQuery.rows.length);
      if (userQuery.rows.length === 0) {
        // User not found
        return res.status(401).json({ error: "Invalid credentials1" });
      }
  
      const user = userQuery.rows[0];

      // Check if the provided password matches the stored password
      if (user.md5password !== password) {
        return res.status(401).json({ error: "Invalid credentials2" });
      }
  
      // Determine the user type (Owner, Tenant, etc.) by checking other tables
      const ownerQuery = await db.query('SELECT * FROM Owner WHERE userID = $1', [user.id]);
      const tenantQuery = await db.query('SELECT * FROM Tenant WHERE userID = $1', [user.id]);
  
      let ownerID = 0, tenantID = 0;
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
app.post('/api/signup-contact', async (req, res) => {
    //Inputs
    const { email, phone } = req.body;
    try {
        let emailExists = 0, phoneExists = 0;
        //Checking if the email is unique
        const emailQuery = await db.query('SELECT * FROM UserInformation WHERE email = $1', [email]);        
        if(emailQuery.rows.length > 0){
            emailExists = 1;
        }
        //Checking if the phone is unique
        const phoneQuery = await db.query('SELECT * FROM UserInformation WHERE phone = $1', [phone]);
        if (phoneQuery.rows.length > 0) {
            phoneExists = 1;
        }
        //Returning Message
        if (emailExists && phoneExists) {
            return res.status(400).json({ error:"Email & Phone already linked to existing accounts"});
        }
        else if (emailExists) {
            return res.status(400).json({ error:"Email already linked to existing account"});
        }
        else if (phoneExists) {
            return res.status(400).json({ error:"Phone already linked to exisitng account"});
        }
        else{
            return res.status(200).json({ success: true});
        }
    } catch (error) {
        console.error("Error during verfication of contacts:", error);
        return res.status(500).json({ error: "Internal Server error"});
    }
})

// API 3: Register Account
app.post('/api/register-account', async (req,res) => {
    //Inputs
    const {userType, firstName, lastName, DOB, email, phone, password} = req.body;
    try {
        //Creating a new record in user table
        const userQuery = await db.query('INSERT INTO UserInformation (firstname, lastname, dob, email, phone, md5password) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id;', [firstName, lastName, DOB, email, phone, password]);
        //Extracting userID
        const userID = userQuery.rows[0].id;        
        //Create the type of user (Owner or Tenant)
        let ownerID = 0, tenantID = 0; 
        if (userType === 'owner') {
            const ownerQuery = await db.query('INSERT INTO Owner (userID) VALUES ($1) RETURNING id;', [userID]);
            ownerID = ownerQuery.rows[0].id;
        }else{
            const tenantQuery = await db.query('INSERT INTO Tenant (userID) VALUES ($1) RETURNING id;', [userID]);
            tenantID = tenantQuery.rows[0].id;
        }
        //Return userID, ownerID, tenantID, success status
        return res.status(200).json({ userID, ownerID, tenantID, success: true});
    } catch (error) {
        console.error("Error during registration of user:", error);
        return res.status(500).json({ error: "Internal Server Error"});
    }
});

// API 4: New Role Registration
app.post('/api/new-role-registration', async (req,res) => {
    //Inputs
    const { userID, userType } = req.body;
    try {
        //Creating new userType
        let ownerID = 0, tenantID = 0; 
        if (userType === 'owner') {
            const ownerQuery = await db.query('INSERT INTO Owner (userID) VALUES ($1) RETURNING id;', [userID]);
            ownerID = ownerQuery.rows[0].id;
        }else{
            const tenantQuery = await db.query('INSERT INTO Tenant (userID) VALUES ($1) RETURNING id;', [userID]);
            tenantID = tenantQuery.rows[0].id;
        }
        //Return userID, ownerID, tenantID, success status
        return res.status(200).json({ userID, ownerID, tenantID, success: true});
    } catch (error) {
        console.error("Error during new role registration:", error);
        return res.status(500).json({ error: "Internal Server Error"});
    }
})

// API 5: Change Password
app.post('/api/change-password', async (req,res) => {
    //Inputs
    const { userID, oldPassword, newPassword } = req.body;
    try {
        const userQuery = await db.query("SELECT * FROM UserInformation WHERE id = $1", [userID]);
        if (userQuery.rows.length > 0) {
            if (userQuery.rows[0].md5password === oldPassword) {
                db.query('UPDATE userinformation SET md5password=$1 WHERE id = $2;', [newPassword,userID]);
                return res.status(200).json({ success: true});
            }
        }
        return res.status(400).json({ error: "Old Password Does not match" })
    } catch (error) {
        console.error("Error during changing password:", error);
        return res.status(500).json({ error: "Internal Server Error"});
    }
})

// API 6: Report A Bug
app.post('/api/report-bug', async (req,res) => {
    //Inputs
    const { userID, userType, bugType, bugDescription } = req.body;
    try {
        const userQuery = await db.query('INSERT INTO ReportedBug (userID, userType, bugType, bugDescription) VALUES ($1,$2,$3,$4) ', [userID, userType, bugType, bugDescription]);
        return res.status(200).json({ success: true});
    } catch (error) {
        console.error("Error during reporting a bug:", error);
        return res.status(500).json({ error: "Internal Server Error"});
    }
})

// API 7: Notification Analytics (Owner)
app.post('/api/notification-analytics', async (req,res) => {
    //Inputs
    const { ownerID } = req.body;
    try {
        const ownerQuery = await db.query("SELECT * FROM Notification WHERE id =$1") 
    } catch (error) {
        console.error("Error during analyzing notifications:", error);
        return res.status(500).json({ error: "Internal Server Error"});
    }
})

// API 8: Notification List
app.post('/api/notification-list', async (req,res) => {
    //Inputs
    const {} = req.body;
    try {
        
    } catch (error) {
        console.error("Error during compiling notification list:", error);
        return res.status(500).json({ error: "Internal Server Error"});
    }
})

// API 9: Month Analytics
app.post('/api/month-analytics', async (req,res) => {
    //Inputs
    const { ownerID } = req.body;
    try {
        // Figure out the current month dynamically
        const currentMonth = new Date().getMonth() + 1; // Months are zero-indexed, so add 1
    
        // Grab ids of the owner's properties which do not have their dueDate as 0 from Property table
        const propertyIDsQuery = await db.query(`SELECT id FROM Property WHERE ownerID = $1 AND dueDate != '0';`, [ownerID]);
    
        const propertyIDs = propertyIDsQuery.rows.map(row => row.id);//this converts from key value pairs to value
    
        if (propertyIDs.length === 0) {
          // No data found
          return res.status(404).json({ error: "No properties found for the owner" });
        }
    
        // Check for all the records of those properties in the RentTransaction table
        const rentTransactionsQuery = await db.query(`
          SELECT amount
          FROM RentTransaction
          WHERE propertyID IN (${propertyIDs.join(',')}) AND EXTRACT(MONTH FROM PaymentDateTime) = $1;
        `, [currentMonth]);
    
        // Sum the amount and return total (totalProfit)
        const totalProfit = rentTransactionsQuery.rows.reduce((total, transaction) => total + parseFloat(transaction.amount), 0);
    
        // Grab the sum of total properties which do not have their dueDate as 0 of a specific owner (totalProperty)
        const totalPropertyQuery = await db.query(`
          SELECT COUNT(id)
          FROM Property
          WHERE ownerID = $1 AND dueDate != '0';
        `, [ownerID]);
    
        const totalProperty = totalPropertyQuery.rows[0].count;
    
        // Grab the sum of total entries filed in the current month of all the properties of a user
        // in the RentTransaction table and return total rents received (totalReceived)
        const totalReceivedQuery = await db.query(`
          SELECT SUM(amount)
          FROM RentTransaction
          WHERE propertyID IN (${propertyIDs.join(',')}) AND EXTRACT(MONTH FROM PaymentDateTime) = $1;
        `, [currentMonth]);
    
        const totalReceived = totalReceivedQuery.rows[0].sum || 0;
    
        // Grab ids of the owner's properties which do not have their dueDate as 0 from Property table
        const pendingRentPropertyIDsQuery = await db.query(`
          SELECT id
          FROM Property
          WHERE ownerID = $1 AND dueDate != '0';
        `, [ownerID]);
    
        const pendingRentPropertyIDs = pendingRentPropertyIDsQuery.rows.map(row => row.id);
    
        // Find out all the tenants associated with those properties
        // Check which of the tenants do not have their tenantID present in the RentTransaction table
        const pendingRentQuery = await db.query(`
          SELECT COUNT(DISTINCT Tenant.id) as count
          FROM Tenant
          LEFT JOIN RentTransaction ON Tenant.id = RentTransaction.tenantID
          WHERE Tenant.rentedPropertyID IN (${pendingRentPropertyIDs.join(',')})
            AND EXTRACT(MONTH FROM RentTransaction.PaymentDateTime) != $1
            AND RentTransaction.PaymentDateTime IS NOT NULL;
        `, [currentMonth]);
    
        const pendingRent = pendingRentQuery.rows[0].count;
    
        // Return the results
        return res.json({
          totalProfit,
          totalProperty,
          totalReceived,
          pendingRent,
          success: true,
        });
    
      } catch (error) {
        console.error("Error during month analytics:", error);
        return res.status(500).json({ error: "Internal server error" });
      }
})

// API 10: Monthly Analytics
app.post('/api/monthly-analytics', async (req,res) => {
    //Inputs
    const {} = req.body;
    try {
        
    } catch (error) {
        console.error("Error during compiling monthly analytics:", error);
        return res.status(500).json({ error: "Internal Server Error"});
    }
})

// API 11: Add Property
app.post('/api/add-property', async (req,res) => {
    //Inputs
    const {  } = req.body;
    try {
        
    } catch (error) {
        console.error("Error during adding properties:", error);
        return res.status(500).json({ error: "Internal Server Error"});
    }
})

// API 12: Property List
app.post('/api/property-list', async (req,res) => {
    //Inputs
    const {} = req.body;
    try {
        
    } catch (error) {
        console.error("Error during compiling property list:", error);
        return res.status(500).json({ error: "Internal Server Error"});
    }
})

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
})