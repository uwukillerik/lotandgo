import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUserId, handleApiError } from "@/lib/auth-request";
import { testDeposit } from "@/lib/wallet-service";
import { getPaymentProvider } from "@/lib/payments";

const schema = z.object({
  amount: z.number().int().positive().max(100_000),
});

export async function POST(request: NextRequest) {
  try {
    if (getPaymentProvider() !== "local") {
      return Response.json(
        { error: "Пополнение через ЮKassa будет подключено позже" },
        { status: 503 },
      );
    }

    const userId = requireUserId(request);
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Укажите сумму от 1 до 100 000 ₽" }, { status: 400 });
    }

    const balanceRubles = await testDeposit(userId, parsed.data.amount);
    return Response.json({ ok: true, balanceRubles });
  } catch (error) {
    return handleApiError(error);
  }
}
