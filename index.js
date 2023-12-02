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

// Login
app.post('/api/login', async (req, res) => {
    const { emailOrNumber, password } = req.body;
  
    try {
      // Check if the email or number exists in the User table
      const userQuery = await db.query('SELECT * FROM "User" WHERE email = $1 OR phone = $1', [emailOrNumber]);
  
      if (userQuery.rows.length === 0) {
        // User not found
        return res.status(401).json({ error: "Invalid credentials" });
      }
  
      const user = userQuery.rows[0];
  
      // Check if the provided password matches the stored password
      if (user.md5Password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
  
      // Determine the user type (Owner, Tenant, etc.) by checking other tables
      const ownerQuery = await db.query('SELECT * FROM "Owner" WHERE userID = $1', [user.id]);
      const tenantQuery = await db.query('SELECT * FROM "Tenant" WHERE userID = $1', [user.id]);
  
      let userType = null;
      let userID = user.id;
  
      if (ownerQuery.rows.length > 0) {
        userType = "owner";
      } else if (tenantQuery.rows.length > 0) {
        userType = "tenant";
      }
  
      // Return the user ID, userType, and success status
      return res.json({ userID, userType, success: true });
  
    } catch (error) {
      console.error("Error during login:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
})