import ResendNotificationProvider from "./resend-notification.service";

export default {
  providers: [
    {
      resolve: ResendNotificationProvider,
      id: "resend",
    },
  ],
};
