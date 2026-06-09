import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "./db/schema";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY не настроен");
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}

export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name: string,
): Promise<string> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) throw new Error("Пользователь не найден");

  if (user.stripeCustomerId) return user.stripeCustomerId;

  const stripe = getStripe();
  const customer = await stripe.customers.create({ email, name, metadata: { userId } });

  await db
    .update(users)
    .set({ stripeCustomerId: customer.id })
    .where(eq(users.id, userId));

  return customer.id;
}

export async function createSetupIntent(customerId: string): Promise<string> {
  const stripe = getStripe();
  const intent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ["card"],
  });
  if (!intent.client_secret) throw new Error("Не удалось создать SetupIntent");
  return intent.client_secret;
}

export async function savePaymentMethod(
  userId: string,
  paymentMethodId: string,
): Promise<void> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user?.stripeCustomerId) throw new Error("Stripe customer не найден");

  const stripe = getStripe();
  const pm = await stripe.paymentMethods.retrieve(paymentMethodId);

  if (pm.customer && pm.customer !== user.stripeCustomerId) {
    throw new Error("Неверный способ оплаты");
  }

  if (!pm.customer) {
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: user.stripeCustomerId,
    });
  }

  await stripe.customers.update(user.stripeCustomerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });

  await db
    .update(users)
    .set({
      stripePaymentMethodId: paymentMethodId,
      paymentVerifiedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function getPaymentStatus(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) return { verified: false, configured: isStripeConfigured() };

  if (!user.paymentVerifiedAt || !user.stripePaymentMethodId) {
    return { verified: false, configured: isStripeConfigured() };
  }

  try {
    if (!isStripeConfigured()) {
      return { verified: true, configured: false };
    }
    const stripe = getStripe();
    const pm = await stripe.paymentMethods.retrieve(user.stripePaymentMethodId);
    return {
      verified: true,
      configured: true,
      brand: pm.card?.brand ?? null,
      last4: pm.card?.last4 ?? null,
      expMonth: pm.card?.exp_month ?? null,
      expYear: pm.card?.exp_year ?? null,
    };
  } catch {
    return { verified: false, configured: isStripeConfigured() };
  }
}
