import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUserId, handleApiError } from "@/lib/auth-request";
import { testWithdraw } from "@/lib/wallet-service";
import { getPaymentProvider } from "@/lib/payments";

const schema = z.object({
  amount: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  try {
    if (getPaymentProvider() !== "local") {
      return Response.json(
        { error: "Вывод через ЮKassa будет подключён позже" },
        { status: 503 },
      );
    }

    const userId = requireUserId(request);
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Укажите сумму вывода" }, { status: 400 });
    }

    const balanceRubles = await testWithdraw(userId, parsed.data.amount);
    return Response.json({ ok: true, balanceRubles });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Недостаточно")) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return handleApiError(error);
  }
}
