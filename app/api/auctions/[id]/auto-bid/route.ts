import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUserId, handleApiError } from "@/lib/auth-request";
import {
  upsertAutoBid,
  disableAutoBid,
  getUserAutoBid,
} from "@/lib/services/autoBidService";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  maxAmount: z.coerce.number().positive("Лимит должен быть > 0"),
});

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id: auctionId } = await params;
    const userId = requireUserId(request);
    const autoBid = await getUserAutoBid(auctionId, userId);
    return Response.json({ autoBid });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id: auctionId } = await params;
    const userId = requireUserId(request);
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Укажите корректный лимит" }, { status: 400 });
    }
    const result = await upsertAutoBid(auctionId, userId, parsed.data.maxAmount);
    return Response.json({ ok: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id: auctionId } = await params;
    const userId = requireUserId(request);
    await disableAutoBid(auctionId, userId);
    return Response.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
