// config/config.js
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

db.connect()
  .then(() => console.log("Connected to the database 'swiftrent'"))
  .catch((err) =>
    console.error("Error connecting to the database 'swiftrent'", err.stack)
  );

export default db;

export const OFFSET = 5 * 60 * 60 * 1000; // Adjusting for timezone (+5 GMT ISB/KHI)
export const OFFSET_STRING = "UTC-00"; // Adjusting for timezone for DB queries
