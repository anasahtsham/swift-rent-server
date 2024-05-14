import { updateRentDaysTask } from "./onOffRentDaysTask.js";
import { createRentNoticesForTenants } from "./rentTasks.js";
import { sendRentPaymentReminders } from "./rentTasks.js";
import { sendDueDatePassedNotifications } from "./rentTasks.js";
import { sendLeaseExpirationNotifications } from "./leaseTasks.js";
import { sendLeaseTerminationNotifications } from "./leaseTasks.js";

export function initializeTasks() {
  updateRentDaysTask();
  createRentNoticesForTenants();
  sendRentPaymentReminders();
  sendDueDatePassedNotifications();
  sendLeaseExpirationNotifications();
  sendLeaseTerminationNotifications();
}
