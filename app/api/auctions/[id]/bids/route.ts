import { NextRequest } from "next/server";
import { placeBidSchema } from "@shared/schemas";
import { placeBid } from "@/lib/services/auctionEngine";
import { requireUserId, handleApiError } from "@/lib/auth-request";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id: auctionId } = await params;
    const userId = requireUserId(request);

    if (!checkRateLimit(`bid:${userId}`, 10, 60_000)) {
      return rateLimitResponse("Слишком много ставок. Подождите немного.");
    }

    const body = await request.json();
    const parsed = placeBidSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Ошибка валидации", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const result = await placeBid(auctionId, userId, parsed.data.amount);
    return Response.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
