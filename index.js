import pg from "pg";
const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "swiftrent",
    password: "12345678",
    port: "5432",
});
db.connect();
import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import { dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("tiny"));

// API 1: Login
app.post('/api/login', async (req, res) => {
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
      return res.json({ userID, ownerID, tenantID, success: true });
  
    } catch (error) {
      console.error("Error during login:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
});

// API 2: Signup Contact Verification
app.post('/api/signup-contact', async (req, res) => {
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

// API 3:Signup Complete

// API 4:

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