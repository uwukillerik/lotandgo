import { NextRequest } from "next/server";
import { requireUserId, handleApiError } from "@/lib/auth-request";
import { verifyLocalPayment, getPaymentProvider } from "@/lib/payments";

export async function POST(request: NextRequest) {
  try {
    const userId = requireUserId(request);
    if (getPaymentProvider() !== "local") {
      return Response.json(
        { error: "Локальная оплата отключена. Используйте PAYMENT_PROVIDER=local" },
        { status: 400 },
      );
    }
    await verifyLocalPayment(userId);
    return Response.json({ ok: true, message: "Тестовый депозит подтверждён" });
  } catch (error) {
    return handleApiError(error);
  }
}
