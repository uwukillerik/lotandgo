import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUserId, handleApiError } from "@/lib/auth-request";
import { savePushSubscription, removePushSubscription, getVapidPublicKey } from "@/lib/push";

const subSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export async function GET() {
  return Response.json({ publicKey: getVapidPublicKey() });
}

export async function POST(request: NextRequest) {
  try {
    const userId = requireUserId(request);
    const body = await request.json();
    const parsed = subSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Некорректная подписка" }, { status: 400 });
    }
    await savePushSubscription(userId, parsed.data);
    return Response.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = requireUserId(request);
    const body = await request.json();
    const endpoint = z.string().url().parse(body.endpoint);
    await removePushSubscription(userId, endpoint);
    return Response.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
