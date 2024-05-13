import db from "../config/config.js";
import cron from "node-cron";

// The five fields are as follows: minute (0-59), hour (0-23), day of the month (1-31), month (1-12), day of the week (0-7).

// the five feilds to run a cron every 5 mins: */5 * * * *
// the five feilds to run a cron every 1 mins: */1 * * * *

// Function to update ON/OFF rent days every day at 00:00
export function updateRentDaysTask() {
  cron.schedule("0 0 * * *", async () => {
    try {
      // Update ON rent days
      await db.query(
        `UPDATE Property SET onRentDays = onRentDays + 1 WHERE propertyStatus = 'L'`
      );

      // Update OFF rent days
      await db.query(
        `UPDATE Property SET offRentDays = offRentDays + 1 WHERE propertyStatus = 'V'`
      );

      console.log("Updated ON/OFF rent days successfully.");
    } catch (error) {
      console.error("Error updating rent days:", error);
    }
  });
}
