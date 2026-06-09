import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return Response.json({ error: "Stripe не настроен" }, { status: 503 });
  }

  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!webhookSecret || !sig) {
    return Response.json({ error: "Webhook не настроен" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "setup_intent.succeeded") {
    const setupIntent = event.data.object;
    const pmId =
      typeof setupIntent.payment_method === "string"
        ? setupIntent.payment_method
        : setupIntent.payment_method?.id;

    if (pmId && setupIntent.customer) {
      const customerId =
        typeof setupIntent.customer === "string"
          ? setupIntent.customer
          : setupIntent.customer.id;

      await db
        .update(users)
        .set({
          stripePaymentMethodId: pmId,
          paymentVerifiedAt: new Date(),
        })
        .where(eq(users.stripeCustomerId, customerId));
    }
  }

  return Response.json({ received: true });
}
