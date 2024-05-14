import db from "../config/config.js";
import cron from "node-cron";

// CRON JOB to create monthly report for owner
export function createMonthlyOwnerReport() {
  cron.schedule("0 0 1 * *", async () => {
    try {
      console.log("Creating monthly report for owners...");

      // Calculate previous month and year
      const currentDate = new Date();
      const prevMonth = currentDate.getMonth(); // Current month is 0-indexed
      const prevYear = currentDate.getFullYear();
      const prevMonthYear =
        prevMonth === 0
          ? `${prevYear - 1}-12`
          : `${prevYear}-${prevMonth < 10 ? "0" + prevMonth : prevMonth}`;

      // Fetch owner IDs
      const ownerIDsQuery = `
        SELECT ida
        FROM UserInformation
        WHERE isOwner = TRUE
      `;
      const { rows: ownerIDs } = await db.query(ownerIDsQuery);

      // Iterate over each owner to calculate monthly report
      for (const owner of ownerIDs) {
        const ownerID = owner.id;

        // Calculate total rents collected
        const rentsCollectedQuery = `
          SELECT COALESCE(SUM(ort.collectedAmount), 0) AS totalCollectedAmount
          FROM OwnerRentTransaction ort
          JOIN Property p ON ort.propertyID = p.id
          JOIN PropertyLease pl ON p.id = pl.propertyID
          WHERE pl.leaseEndedOn >= DATE '${prevMonthYear}-01' AND pl.leaseEndedOn < DATE '${currentDate
          .toISOString()
          .substring(0, 10)}' AND p.ownerID = $1
        `;
        const { rows: rentsCollected } = await db.query(rentsCollectedQuery, [
          ownerID,
        ]);
        const totalRentsCollected = rentsCollected[0].totalCollectedAmount;

        // Calculate total maintenance costs
        const maintenanceCostsQuery = `
          SELECT COALESCE(SUM(mr.maintenanceCost), 0) AS totalMaintenanceCost
          FROM MaintenanceReport mr
          JOIN Property p ON mr.propertyID = p.id
          WHERE mr.createdOn >= DATE '${prevMonthYear}-01' AND mr.createdOn < DATE '${currentDate
          .toISOString()
          .substring(0, 10)}' AND p.ownerID = $1
        `;
        const { rows: maintenanceCosts } = await db.query(
          maintenanceCostsQuery,
          [ownerID]
        );
        const totalMaintenanceCosts = maintenanceCosts[0].totalMaintenanceCost;

        // Insert monthly report into database
        const insertReportQuery = `
          INSERT INTO MonthlyReportOwner (ownerID, currentDate, rentCollected, maintenanceCost)
          VALUES ($1, DATE '${prevMonthYear}-01', $2, $3)
        `;
        await db.query(insertReportQuery, [
          ownerID,
          totalRentsCollected,
          totalMaintenanceCosts,
        ]);
      }

      console.log("Monthly report for owners created successfully.");
    } catch (error) {
      console.error("Error creating monthly report for owners:", error);
    }
  });
}
