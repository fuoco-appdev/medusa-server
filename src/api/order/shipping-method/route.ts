import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import { z } from "zod"; // For schema validation

const ShippingMethodBodySchema = z.object({
  order_id: z.string().min(1, "Order id is required"),
  shipping_option_id: z.string().min(1, "Shipping option id is required"),
  name: z.string().min(1, "Name is required"),
  amount: z.number(),
});

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parsed = ShippingMethodBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid request body",
      details: parsed.error.errors,
    });
  }

  const { order_id, shipping_option_id, name, amount } = await parsed.data;
  const orderService = req.scope.resolve(Modules.ORDER);

  // 1. Get order
  const order = await orderService.retrieveOrder(order_id, {
    relations: ["shipping_methods"],
  });

  if (!order.shipping_methods?.length) {
    return res.status(400).json({ message: "Order has no shipping methods" });
  }

  for (const method of order.shipping_methods) {
    await orderService.deleteOrderShippingMethods(method.id);
  }

  await orderService.createOrderShippingMethods({
    shipping_option_id: shipping_option_id,
    order_id: order_id,
    name: name,
    amount: amount,
  });

  const updatedOrder = await orderService.retrieveOrder(order_id, {
    relations: ["shipping_methods"],
  });

  res.json({ order: updatedOrder });
}
