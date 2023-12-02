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
import morgan from "morgan"; //logging tool

//finding out directory folder
import { dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));

//Initiating Express Server
const app = express();
const port = 3000;

//Parser
app.use(bodyParser.urlencoded({ extended: true }));
//Logger
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
        console.error("Error during verfication:", error);
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
        console.error("Error during registration of user:", error);
        return res.status(500).json({ error: "Internal Server Error"});
    }
})

// API 5: 

// API 6:

// API 7:

// API 8:

// API 9:

// API 10:

// API 11:

// API 12:

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
})