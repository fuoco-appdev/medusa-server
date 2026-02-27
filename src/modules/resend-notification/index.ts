import ResendNotificationService from "./service";
import { Module } from "@medusajs/framework/utils";

export const RESEND_NOTIFICATION_MODULE = "resend_notification";

export default Module(RESEND_NOTIFICATION_MODULE, {
  service: ResendNotificationService,
});
