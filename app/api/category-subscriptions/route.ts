import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUserId, handleApiError } from "@/lib/auth-request";
import {
  listUserCategorySubscriptions,
  toggleCategorySubscription,
} from "@/lib/services/categorySubscriptionService";
import { LOT_CATEGORIES } from "@shared/categories";

export async function GET(request: NextRequest) {
  try {
    const userId = requireUserId(request);
    const subs = await listUserCategorySubscriptions(userId);
    return Response.json({
      categories: LOT_CATEGORIES.filter((c) => c !== "Все"),
      subscriptions: subs,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

const toggleSchema = z.object({
  category: z.string().min(1),
  enabled: z.boolean(),
});

export async function POST(request: NextRequest) {
  try {
    const userId = requireUserId(request);
    const body = await request.json();
    const parsed = toggleSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Некорректные данные" }, { status: 400 });
    }
    const result = await toggleCategorySubscription(
      userId,
      parsed.data.category,
      parsed.data.enabled,
    );
    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
