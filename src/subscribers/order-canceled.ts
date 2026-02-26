import { SubscriberConfig } from "@medusajs/framework";

function get(obj: any, path: string) {
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
}

function renderTemplate(template: string, data: Record<string, any>) {
  return template.replace(/{{(.*?)}}/g, (_, key) => {
    const value = get(data, key.trim());
    return value ?? "";
  });
}

function formatAmount(amount: number) {
  return `$${(amount / 100).toFixed(2)}`;
}

let cachedTemplate: string | null = null;
async function getTemplate(url: string) {
  if (cachedTemplate) return cachedTemplate;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch order canceled template");
  cachedTemplate = await res.text();
  return cachedTemplate;
}

export default async function orderCanceledHandler({ event, container }) {
  const notificationModuleService = container.resolve(
    "notificationModuleService",
  );

  const order = event.data;

  const templateUrl = process.env.ORDER_CANCELED_TEMPLATE_URL;

  if (!templateUrl) {
    console.error("ORDER_CANCELED_TEMPLATE_URL is not set");
    return;
  }

  const template = await getTemplate(templateUrl);

  const templateData = {
    // core
    order,
    id: order.id,
    display_id: order.display_id,
    status: order.status,
    email: order.email,
    created_at: order.created_at,
    canceled_at: order.canceled_at,
    currency_code: order.currency_code,

    // totals
    subtotal: formatAmount(order.subtotal),
    shipping_total: formatAmount(order.shipping_total),
    discount_total: formatAmount(order.discount_total),
    tax_total: formatAmount(order.tax_total),
    total: formatAmount(order.total),
    refunded_total: formatAmount(order.refunded_total || 0),

    // customer
    first_name: order.shipping_address?.first_name,
    last_name: order.shipping_address?.last_name,
    customer: order.customer,

    // address
    shipping_address: order.shipping_address,

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
  };

  const html = renderTemplate(template, templateData);

  await notificationModuleService.createNotifications({
    to: order.email,
    channel: "email",
    template: "order-canceled",
    data: {
      subject: `Your order #${order.display_id} has been canceled`,
      html,
    },
  });
}

export const config: SubscriberConfig = {
  event: `order.canceled`,
};
