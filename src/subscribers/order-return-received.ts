import { SubscriberConfig } from "@medusajs/framework";
import { SubscriberArgs } from "@medusajs/medusa";

let cachedTemplate: string | null = null;
async function getTemplate(url: string) {
  if (cachedTemplate) return cachedTemplate;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch items returned template");
  cachedTemplate = await res.text();
  return cachedTemplate;
}

function formatAmount(amount: number) {
  return `$${(amount / 100).toFixed(2)}`;
}

function get(obj: any, path: string) {
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
}

function renderTemplate(template: string, data: Record<string, any>) {
  return template.replace(/{{(.*?)}}/g, (_, key) => {
    const value = get(data, key.trim());
    return value ?? "";
  });
}

export default async function orderReturnReceivedHandler({ event, container }) {
  const notificationModuleService = container.resolve(
    "notificationModuleService",
  );

  /**
   * Medusa event data for returned items:
   * event.data = return object (Return)
   */
  const returnObj = event.data;
  const order = returnObj.order;

  // 1. Load template from CDN
  const templateUrl = process.env.ITEMS_RETURNED_TEMPLATE_URL!;
  const template = await getTemplate(templateUrl);

  // 2. Prepare SendGrid-style template variables
  const templateData = {
    // core
    return: returnObj,
    order,
    id: order.id,
    display_id: order.display_id,
    email: order.email,
    status: order.status,
    currency_code: order.currency_code,

    // return info
    return_id: returnObj.id,
    return_status: returnObj.status,
    returned_at: returnObj.received_at || returnObj.updated_at,
    refund_total: formatAmount(returnObj.refund_amount || 0),

    // items returned
    items: returnObj.items.map((item) => ({
      title: item.title,
      quantity: item.quantity,
      reason: item.reason,
      note: item.note,
    })),

    // totals
    subtotal: formatAmount(order.subtotal),
    shipping_total: formatAmount(order.shipping_total),
    tax_total: formatAmount(order.tax_total),
    total: formatAmount(order.total),

    // customer
    first_name: order.shipping_address?.first_name,
    last_name: order.shipping_address?.last_name,

    // address
    shipping_address: order.shipping_address,
  };

  // 3. Render template
  const html = renderTemplate(template, templateData);

  // 4. Send notification
  await notificationModuleService.createNotifications({
    to: order.email,
    channel: "email",
    template: "items-returned",
    data: {
      subject: `Return processed for order #${order.display_id}`,
      html,
    },
  });
}

export const config: SubscriberConfig = {
  event: `order.return_received`,
};
