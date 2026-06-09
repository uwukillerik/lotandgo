import { NextRequest } from "next/server";
import { requireUserId, handleApiError } from "@/lib/auth-request";
import { getPaymentProvider } from "@/lib/payments";
import { savePaymentMethod } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    if (getPaymentProvider() !== "stripe") {
      return Response.json({ error: "Stripe отключён" }, { status: 503 });
    }

    const userId = requireUserId(request);
    const { paymentMethodId } = await request.json();

    if (!paymentMethodId || typeof paymentMethodId !== "string") {
      return Response.json({ error: "paymentMethodId обязателен" }, { status: 400 });
    }

    await savePaymentMethod(userId, paymentMethodId);
    return Response.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
