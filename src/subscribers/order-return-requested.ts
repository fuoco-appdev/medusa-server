import { SubscriberConfig } from "@medusajs/framework";
import { SubscriberArgs } from "@medusajs/medusa";

let cachedTemplate: string | null = null;

async function getTemplate(url: string) {
  if (cachedTemplate) return cachedTemplate;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch return-requested template");
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

export default async function orderReturnRequestedHandler({
  event,
  container,
}) {
  const notificationModuleService = container.resolve(
    "notificationModuleService",
  );

  // Medusa sends a return object
  const returnRequest = event.data;
  const order = returnRequest.order;

  // 1. Load remote template (cached)
  const templateUrl = process.env.ORDER_RETURN_REQUESTED_TEMPLATE_URL!;
  const template = await getTemplate(templateUrl);

  // 2. Prepare SendGrid-style variables
  const templateData = {
    // core
    return: returnRequest,
    order,
    id: order.id,
    display_id: order.display_id,
    email: order.email,
    status: order.status,
    created_at: order.created_at,
    currency_code: order.currency_code,

    // return details
    return_id: returnRequest.id,
    return_status: returnRequest.status,
    return_items: returnRequest.items.map((item) => ({
      title: item.title,
      quantity: item.quantity,
      reason: item.reason,
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

  // 4. Send email
  await notificationModuleService.createNotifications({
    to: order.email,
    channel: "email",
    template: "return-requested",
    data: {
      subject: `Return requested for order #${order.display_id}`,
      html,
    },
  });
}

export const config: SubscriberConfig = {
  event: `order.return_requested`,
};
