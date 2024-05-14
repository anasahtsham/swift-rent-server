import db from "../config/config.js";
import cron from "node-cron";

// CRON JOB to create rent notices for tenants
export function createRentNoticesForTenants() {
  cron.schedule("10 0 1 * *", async () => {
    // Run every 1st day of the month at 00:10
    try {
      console.log("Creating rent notices for tenants...");

      // Get all leased properties
      const leasedPropertiesQuery = `
          SELECT * FROM Property WHERE propertyStatuss = 'L'
        `;
      const leasedProperties = await db.query(leasedPropertiesQuery);

      for (const property of leasedProperties.rows) {
        // Find active leases for the property
        const activeLeaseQuery = `
            SELECT * FROM PropertyLease
            WHERE propertyID = $1 AND leaseStatus = 'A'
          `;
        const activeLeases = await db.query(activeLeaseQuery, [property.id]);

        for (const lease of activeLeases.rows) {
          // Check if advance payment period has passed
          const currentDate = new Date();
          const leaseCreatedDate = new Date(lease.leaseCreatedOn);
          leaseCreatedDate.setMonth(
            leaseCreatedDate.getMonth() + lease.advancePaymentForMonths
          );

          if (currentDate >= leaseCreatedDate) {
            // Check if there are pending notices for this lease
            const pendingNoticesQuery = `
                SELECT * FROM TenantRentNotice
                WHERE propertyID = $1 AND tenantID = $2 AND paymentStatus = 'P'
              `;
            const pendingNotices = await db.query(pendingNoticesQuery, [
              property.id,
              lease.tenantID,
            ]);

            for (const notice of pendingNotices.rows) {
              // Skip pending notices
              const updateNoticeQuery = `
                  UPDATE TenantRentNotice
                  SET paymentStatus = 'S'
                  WHERE id = $1
                `;
              await db.query(updateNoticeQuery, [notice.id]);
            }

            // Calculate new rent amount for the tenant
            let newRentAmount = lease.rent;
            let newDueDate = currentDate.getDate().toString();
            let newFine = 0;

            // Check if previous month rent was skipped
            const lastNoticeQuery = `
                SELECT * FROM TenantRentNotice
                WHERE propertyID = $1 AND tenantID = $2
                ORDER BY createdOn DESC
                LIMIT 1
              `;
            const lastNoticeResult = await db.query(lastNoticeQuery, [
              property.id,
              lease.tenantID,
            ]);

            if (lastNoticeResult.rows.length > 0) {
              const lastNotice = lastNoticeResult.rows[0];
              if (lastNotice.paymentStatus === "S") {
                newRentAmount += lastNotice.rentAmount;
                newFine = lastNotice.fine;
              }
            }

            // Insert new rent notice
            const insertNoticeQuery = `
                INSERT INTO TenantRentNotice (propertyID, tenantID, rentAmount, dueDate, fine, paymentStatus, createdOn)
                VALUES ($1, $2, $3, $4, $5, 'P', CURRENT_TIMESTAMP)
              `;
            await db.query(insertNoticeQuery, [
              property.id,
              lease.tenantID,
              newRentAmount,
              newDueDate,
              newFine,
            ]);

            // Send notification to the tenant
            const notificationText = `New rent notice generated for property ${property.id}. Please check your account for details.`;
            const insertNotificationQuery = `
                INSERT INTO UserNotification (userID, userType, senderType, notificationText, notificationType)
                VALUES ($1, 'T', 'A', $2, 'R')
              `;
            await db.query(insertNotificationQuery, [
              lease.tenantID,
              notificationText,
            ]);

            console.log(
              `Rent notice created for tenant ${lease.tenantID} of property ${property.id}`
            );
          }
        }
      }

      console.log("Rent notices created successfully.");
    } catch (error) {
      // console.error("Error creating rent notices:", error);
    }
  });
}

// CRON JOB to send notifications to tenants reminding them of the last day to pay rent
export function sendRentPaymentReminders() {
  cron.schedule("0 0 * * *", async () => {
    // Run every day at 00:00
    try {
      console.log("Sending rent payment reminders to tenants...");

      // Get all pending rent notices for today's due date
      const currentDate = new Date().getDate().toString().padStart(2, "0");
      const pendingNoticesQuery = `
          SELECT tn.ida, tn.tenantID, tn.propertyID, tn.dueDate, u.phone
          FROM TenantRentNotice tn
          JOIN UserInformation u ON tn.tenantID = u.id
          WHERE tn.dueDate = $1 AND tn.paymentStatus = 'P'
        `;
      const { rows: pendingNotices } = await db.query(pendingNoticesQuery, [
        currentDate,
      ]);

      for (const notice of pendingNotices) {
        // Send notification to the tenant
        const notificationText = `Dear tenant, this is a reminder that today is the last day to pay your rent for property ${notice.propertyID}. Please make sure to submit your payment by the end of the day. Thank you.`;
        // Send notification logic here (e.g., via SMS or push notification)
        const insertNoticeQuery = `
            INSERT INTO UserNotification (userID, userType, senderType, notificationText, notificationType)
            VALUES ($1, 'T', 'A', $2, 'R')
            `;
        await db.query(insertNoticeQuery, [notice.tenantID, notificationText]);
      }

      console.log("Rent payment reminders sent successfully.");
    } catch (error) {
      // console.error("Error sending rent payment reminders:", error);
    }
  });
}

// CRON JOB to send notifications to tenants about the passing of due date and imposing fines
export function sendDueDatePassedNotifications() {
  cron.schedule("0 0 * * *", async () => {
    // Run every day at 00:00
    try {
      console.log("Sending due date passed notifications to tenants...");

      // Get all pending rent notices with passed due date
      const currentDate = new Date().getDate().toString().padStart(2, "0");
      const pendingNoticesQuery = `
          SELECT tn.ida, tn.tenantID, tn.propertyID, tn.dueDate, tn.fine, u.phone
          FROM TenantRentNotice tn
          JOIN UserInformation u ON tn.tenantID = u.id
          WHERE tn.dueDate < $1 AND tn.paymentStatus = 'P'
        `;
      const { rows: pendingNotices } = await db.query(pendingNoticesQuery, [
        currentDate,
      ]);

      for (const notice of pendingNotices) {
        // Check if there are any fines for the tenant
        let isLate = false;
        let fineMessage = "";
        if (notice.fine > 0) {
          isLate = true;
          fineMessage = ` A fine of ${notice.fine} PKR has been imposed.`;
        }

        // Update the isLate column in the database
        const updateIsLateQuery = `
            UPDATE TenantRentNotice
            SET isLate = $1
            WHERE id = $2
          `;
        await db.query(updateIsLateQuery, [isLate, notice.id]);

        // Send notification to the tenant
        const notificationText = `Your rent payment for property ${notice.propertyID} was due on ${notice.dueDate}. 
          ${fineMessage} Please ensure timely payment to avoid further penalties. Thank you.`;
        // Send notification logic here (e.g., via SMS or push notification)
        const insertNoticeQuery = `
                INSERT INTO UserNotification (userID, userType, senderType, notificationText, notificationType)
                VALUES ($1, 'T', 'A', $2, 'R')
            `;
        await db.query(insertNoticeQuery, [notice.tenantID, notificationText]);
      }

      console.log("Due date passed notifications sent successfully.");
    } catch (error) {
      // console.error("Error sending due date passed notifications:", error);
    }
  });
}
