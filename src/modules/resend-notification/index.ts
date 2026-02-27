import ResendNotificationService from "./resend-notification.service";
import { Module } from "@medusajs/framework/utils";

export const RESEND_NOTIFICATION_MODULE = "resend-notification";

export default Module(RESEND_NOTIFICATION_MODULE, {
  service: ResendNotificationService,
});
