import { Resend } from "resend";

type Options = {
  api_key: string;
  from: string;
};

export default class ResendNotificationProvider {
  static identifier = "resend-notification";

  protected resend: Resend;
  protected options: Options;

  constructor(_, options: Options) {
    this.options = options;
    this.resend = new Resend(options.api_key);
  }

  /**
   * Main method Medusa calls
   */
  async send(notification) {
    const { to, subject, html } = notification.data;

    const res = await this.resend.emails.send({
      from: this.options.from,
      to,
      subject,
      html,
    });

    return {
      id: res.data?.id,
    };
  }
}
