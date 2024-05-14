import { updateRentDaysTask } from "./onOffRentDaysTask.js";
import { createRentNoticesForTenants } from "./tenantRents.js";
import { sendRentPaymentReminders } from "./tenantRents.js";
import { sendDueDatePassedNotifications } from "./tenantRents.js";

export function initializeTasks() {
  updateRentDaysTask();
  createRentNoticesForTenants();
  sendRentPaymentReminders();
  sendDueDatePassedNotifications();
}
