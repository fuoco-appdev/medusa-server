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
  if (!res.ok) throw new Error("Failed to fetch order shipped template");
  cachedTemplate = await res.text();
  return cachedTemplate;
}

export default async function orderShippedHandler({ event, container }) {
  const notificationModuleService = container.resolve(
    "notificationModuleService",
  );

  const fulfillment = event.data;
  const order = fulfillment.order;

  const templateUrl = process.env.ORDER_SHIPPED_TEMPLATE_URL;
  if (!templateUrl) {
    console.error("ORDER_SHIPPED_TEMPLATE_URL is not set");
    return;
  }

  const template = await getTemplate(templateUrl);

  const trackingLinks = fulfillment.tracking_links || [];
  const trackingNumbers = trackingLinks.map((t) => t.tracking_number);
  const trackingUrls = trackingLinks.map((t) => t.url);

  // 3. Build SendGrid-style template variables
  const templateData = {
    // core
    order,
    fulfillment,
    id: order.id,
    display_id: order.display_id,
    email: order.email,
    status: order.status,
    created_at: order.created_at,
    currency_code: order.currency_code,

    // shipping
    shipped_at: fulfillment.created_at,
    tracking_numbers: trackingNumbers.join(", "),
    tracking_urls: trackingUrls,
    shipping_method: fulfillment.shipping_option?.name,

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

    // items (only fulfilled items ideally)
    items: fulfillment.items.map((item) => ({
      title: item.title,
      quantity: item.quantity,
      thumbnail: item.thumbnail,
      variant: item.variant,
    })),
  };

  const html = renderTemplate(template, templateData);

  await notificationModuleService.createNotifications({
    to: order.email,
    channel: "email",
    template: "order-shipped",
    data: {
      subject: `Your order #${order.display_id} has been shipped`,
      html,
    },
  });
}

export const config: SubscriberConfig = {
  event: `order.shipped`,
};
