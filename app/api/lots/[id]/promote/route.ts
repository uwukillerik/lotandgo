import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUserId, handleApiError } from "@/lib/auth-request";
import { purchaseLotPromotion } from "@/lib/promotion-service";

const bodySchema = z.object({
  tier: z.enum(["boost", "featured", "premium"]),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const userId = requireUserId(request);
    const { id: lotId } = await params;
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Укажите тариф: boost, featured или premium" }, { status: 400 });
    }

    const result = await purchaseLotPromotion(userId, lotId, parsed.data.tier);
    return Response.json({ ok: true, promotion: result });
  } catch (error) {
    return handleApiError(error);
  }
}
