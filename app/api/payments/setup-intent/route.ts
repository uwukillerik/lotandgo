import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireUserId, handleApiError } from "@/lib/auth-request";
import { getPaymentProvider } from "@/lib/payments";
import {
  createSetupIntent,
  getOrCreateStripeCustomer,
} from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    if (getPaymentProvider() !== "stripe") {
      return Response.json(
        { error: "Stripe отключён. Используйте тестовую оплату в профиле." },
        { status: 503 },
      );
    }

    const userId = requireUserId(request);
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return Response.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    const customerId = await getOrCreateStripeCustomer(userId, user.email, user.name);
    const clientSecret = await createSetupIntent(customerId);

    return Response.json({ clientSecret });
  } catch (error) {
    return handleApiError(error);
  }
}
