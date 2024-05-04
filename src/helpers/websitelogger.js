import db from "../config/config.js"; // assuming this is the correct path to your config file

export function logVisit() {
  db.query("INSERT INTO WebsiteLog DEFAULT VALUES", (error, results) => {
    if (error) {
      console.error("Error inserting log:", error.stack);
    }
  });
}
