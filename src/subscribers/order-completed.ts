import { SubscriberConfig } from "@medusajs/framework";
import { SubscriberArgs } from "@medusajs/medusa";
import { RESEND_NOTIFICATION_MODULE } from "../modules/resend-notification";

let cachedTemplate: string | null = null;
async function getTemplate(url: string) {
  if (cachedTemplate) return cachedTemplate;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch order completed template");
  cachedTemplate = await res.text();
  return cachedTemplate;
}

function formatAmount(amount: number) {
  return `$${(amount / 100).toFixed(2)}`;
}

function renderTemplate(template: string, data: Record<string, any>) {
  return template.replace(/{{(.*?)}}/g, (_, key) => {
    const value = get(data, key.trim());
    return value ?? "";
  });
}

function get(obj: any, path: string) {
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
}

export default async function orderCompletedHandler({ event, container }) {
  const notificationModuleService = container.resolve(
    RESEND_NOTIFICATION_MODULE,
  );

  const order = event.data;

  // 1. Load template from CDN
  const templateUrl = process.env.ORDER_COMPLETED_TEMPLATE_URL;

  if (!templateUrl) {
    console.error("ORDER_COMPLETED_TEMPLATE_URL is not set");
    return;
  }

  const template = await getTemplate(templateUrl);

  // 2. Build SendGrid-compatible template variables
  const templateData = {
    // core
    order,
    id: order.id,
    display_id: order.display_id,
    status: order.status,
    email: order.email,
    created_at: order.created_at,
    completed_at: order.completed_at,
    currency_code: order.currency_code,

    // totals
    subtotal: formatAmount(order.subtotal),
    shipping_total: formatAmount(order.shipping_total),
    discount_total: formatAmount(order.discount_total),
    tax_total: formatAmount(order.tax_total),
    total: formatAmount(order.total),

    // customer
    first_name: order.shipping_address?.first_name,
    last_name: order.shipping_address?.last_name,
    customer: order.customer,

    // address
    shipping_address: order.shipping_address,
    billing_address: order.billing_address,

    // items
    items: order.items.map((item) => ({
      title: item.title,
      description: item.description,
      quantity: item.quantity,
      unit_price: formatAmount(item.unit_price),
      total: formatAmount(item.total),
      thumbnail: item.thumbnail,
      variant: item.variant,
    })),

    // payments
    payment_status: order.payment_status,
    fulfillment_status: order.fulfillment_status,
  };

  // 3. Render template
  const html = renderTemplate(template, templateData);

  // 4. Send notification
  await notificationModuleService.createNotifications({
    to: order.email,
    channel: "email",
    template: "order-completed",
    data: {
      subject: `Order #${order.display_id} completed 🎉`,
      html,
    },
  });
}

export const config: SubscriberConfig = {
  event: `order.completed`,
};
