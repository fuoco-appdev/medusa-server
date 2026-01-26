import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils"
import { z } from "zod"; // For schema validation

const PaymentSessionBodySchema = z.object({
  payment_collection_id: z.string().min(1, "Payment collection id is required"),
  provider_id: z.string().min(1, "Provider id is required"),
  currency_code: z.string().min(1, "Currency code is required"),
  amount: z.number().positive("Amount must be positive"),
  data: z.object<Record<string, any>>({}).optional()
});

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  res.sendStatus(200);
}


export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  // Validate request body
  const parsed = PaymentSessionBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid request body",
      details: parsed.error.errors,
    });
  }

  const { payment_collection_id, provider_id, currency_code, amount, data } = await parsed.data;
  const paymentService = req.scope.resolve(
    Modules.PAYMENT
  )

  const paymentSession =
    await paymentService.createPaymentSession(payment_collection_id, {
      provider_id: provider_id,
      currency_code: currency_code,
      amount: amount,
      data: data ?? {},
    });

    res.json({
      paymentSessionId: paymentSession.id,
    });
}