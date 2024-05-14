import db from "../config/config.js";
import cron from "node-cron";

// CRON JOB to send notifications about tenant leases expiring next month
export function sendLeaseExpirationNotifications() {
  cron.schedule("0 0 1 * *", async () => {
    // Run every 1st day of the month at 00:00
    try {
      console.log(
        "Sending lease expiration notifications to tenants, owners, and managers..."
      );

      // Get all active property leases with lease expiration next month
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const currentYear = currentDate.getFullYear();
      const nextMonthYear = nextMonth === 1 ? currentYear + 1 : currentYear;
      const nextMonthStartDate = new Date(`${nextMonthYear}-${nextMonth}-01`);
      const nextMonthEndDate = new Date(nextMonthYear, nextMonth, 0);
      const nextMonthFirstDay = nextMonthStartDate
        .getDate()
        .toString()
        .padStart(2, "0");
      const nextMonthLastDay = nextMonthEndDate
        .getDate()
        .toString()
        .padStart(2, "0");

      const expirationDateRange = `${nextMonthFirstDay}-${nextMonthLastDay}`;

      const expirationNotificationsQuery = `
          SELECT pl.ida AS leaseID, pl.propertyID, pl.tenantID, pl.managerID, uo.phone AS ownerPhone, ut.phone AS tenantPhone, um.phone AS managerPhone
          FROM PropertyLease pl
          JOIN Property p ON pl.propertyID = p.id
          JOIN UserInformation uo ON p.ownerID = uo.id
          JOIN UserInformation ut ON pl.tenantID = ut.id
          LEFT JOIN UserInformation um ON p.managerID = um.id
          WHERE pl.leaseStatus = 'A'
          AND EXTRACT(MONTH FROM pl.leaseCreatedOn) = $1
          AND pl.leasedForMonths = 1
        `;
      const { rows: expirationNotifications } = await db.query(
        expirationNotificationsQuery,
        [currentMonth]
      );

      for (const notification of expirationNotifications) {
        // Send notification to tenant
        const tenantNotificationText = `Dear tenant, your lease for property ${notification.propertyID} is expiring on ${expirationDateRange}. Please make sure to clear any dues before the expiration date. Thank you.`;
        // Send tenant notification logic here
        const insertTenantNotificationQuery = `
            INSERT INTO UserNotification (userID, userType, senderType, notificationText, notificationType)
            VALUES ($1, 'T', 'A', $2, 'L')
            `;
        await db.query(insertTenantNotificationQuery, [
          notification.tenantID,
          tenantNotificationText,
        ]);

        // Send notification to owner
        const ownerNotificationText = `Dear owner, the lease for your property ${notification.propertyID} with tenant ${notification.tenantID} is expiring on ${expirationDateRange}. Please ensure that any necessary arrangements are made. Thank you.`;
        // Send owner notification logic here
        const insertOwnerNotificationQuery = `
            INSERT INTO UserNotification (userID, userType, senderType, notificationText, notificationType)
            VALUES ($1, 'O', 'A', $2, 'L')
            `;
        await db.query(insertOwnerNotificationQuery, [
          notification.ownerID,
          ownerNotificationText,
        ]);

        // Send notification to manager if exists
        if (notification.managerPhone) {
          const managerNotificationText = `Dear manager, the lease for property ${notification.propertyID} with tenant ${notification.tenantID} is expiring on ${expirationDateRange}. Please assist in any necessary preparations. Thank you.`;
          // Send manager notification logic here
          const insertManagerNotificationQuery = `
                INSERT INTO UserNotification (userID, userType, senderType, notificationText, notificationType)
                VALUES ($1, 'M', 'A', $2, 'L')
                `;
          await db.query(insertManagerNotificationQuery, [
            notification.managerID,
            managerNotificationText,
          ]);
        }
      }

      console.log("Lease expiration notifications sent successfully.");
    } catch (error) {
      console.error("Error sending lease expiration notifications:", error);
    }
  });
}

// CRON JOB to send notifications about tenant lease termination due to expiry of lease
export function sendLeaseTerminationNotifications() {
  cron.schedule("0 0 1 * *", async () => {
    try {
      console.log(
        "Sending lease termination notifications to tenants, owners, and managers..."
      );

      // Get all active property leases with expired lease period
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;

      const expirationNotificationsQuery = `
          SELECT pl.ida AS leaseID, pl.propertyID, pl.tenantID, pl.managerID, uo.phone AS ownerPhone, ut.phone AS tenantPhone, um.phone AS managerPhone
          FROM PropertyLease pl
          JOIN Property p ON pl.propertyID = p.id
          JOIN UserInformation uo ON p.ownerID = uo.id
          JOIN UserInformation ut ON pl.tenantID = ut.id
          LEFT JOIN UserInformation um ON p.managerID = um.id
          WHERE pl.leaseStatus = 'A'
          AND EXTRACT(MONTH FROM pl.leaseCreatedOn) = $1
          AND pl.leaseCreatedOn + INTERVAL '1 MONTH' * pl.leasedForMonths <= CURRENT_TIMESTAMP
        `;
      const { rows: expirationNotifications } = await db.query(
        expirationNotificationsQuery,
        [currentMonth]
      );

      for (const notification of expirationNotifications) {
        // Update lease status to expired and set lease end timestamp
        const updateLeaseQuery = `
            UPDATE PropertyLease
            SET leaseStatus = 'E', leaseEndedOn = CURRENT_TIMESTAMP
            WHERE id = $1
          `;
        await db.query(updateLeaseQuery, [notification.leaseID]);

        // Set property tenantID as null and property status as vacant
        const updatePropertyQuery = `
            UPDATE Property
            SET tenantID = NULL, propertyStatus = 'V'
            WHERE id = $1
          `;
        await db.query(updatePropertyQuery, [notification.propertyID]);

        // Insert into TerminateLease table
        const insertTerminateLeaseQuery = `
            INSERT INTO TerminateLease (ownerID, propertyLeaseID, terminationGeneratedBy, terminationDate, moneyReturned, terminationReason)
            VALUES ($1, $2, 'S', CURRENT_TIMESTAMP, 0, 'end of lease period')
          `;
        await db.query(insertTerminateLeaseQuery, [
          notification.ownerID,
          notification.leaseID,
        ]);

        // Send notification to tenant
        const tenantNotificationText = `Dear tenant, your lease for property ${notification.propertyID} has expired. Please vacate the property accordingly. Thank you.`;
        // Send tenant notification logic here
        const insertTenantNotificationQuery = `
            INSERT INTO UserNotification (userID, userType, senderType, notificationText, notificationType)
            VALUES ($1, 'T', 'A', $2, 'T')
          `;
        await db.query(insertTenantNotificationQuery, [
          notification.tenantID,
          tenantNotificationText,
        ]);

        // Send notification to owner
        const ownerNotificationText = `Dear owner, the lease for your property ${notification.propertyID} with tenant ${notification.tenantID} has expired. Please make necessary arrangements. Thank you.`;
        // Send owner notification logic here
        const insertOwnerNotificationQuery = `
            INSERT INTO UserNotification (userID, userType, senderType, notificationText, notificationType)
            VALUES ($1, 'O', 'A', $2, 'T')
          `;
        await db.query(insertOwnerNotificationQuery, [
          notification.ownerID,
          ownerNotificationText,
        ]);

        // Send notification to manager if exists
        if (notification.managerPhone) {
          const managerNotificationText = `Dear manager, the lease for property ${notification.propertyID} with tenant ${notification.tenantID} has expired. Please assist in any necessary actions. Thank you.`;
          // Send manager notification logic here
          const insertManagerNotificationQuery = `
                    INSERT INTO UserNotification (userID, userType, senderType, notificationText, notificationType)
                    VALUES ($1, 'M', 'A', $2, 'T')
                `;
          await db.query(insertManagerNotificationQuery, [
            notification.managerID,
            managerNotificationText,
          ]);
        }
      }

      console.log("Lease termination notifications sent successfully.");
    } catch (error) {
      console.error("Error sending lease termination notifications:", error);
    }
  });
}
