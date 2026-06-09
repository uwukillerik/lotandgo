import { eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "./db/schema";
import { isStripeConfigured, getPaymentStatus as getStripePaymentStatus } from "./stripe";

export type PaymentProvider = "local" | "stripe" | "none";

const LOCAL_METHOD_ID = "local:test";

/** Режим оплаты: local по умолчанию (тест до ЮKassa), stripe только если явно включён */
export function getPaymentProvider(): PaymentProvider {
  const explicit = process.env.PAYMENT_PROVIDER?.toLowerCase();
  if (explicit === "stripe" && isStripeConfigured()) return "stripe";
  if (explicit === "none") return "none";
  if (explicit === "stripe" && !isStripeConfigured()) return "local";
  return "local";
}

export function isPaymentRequired(): boolean {
  return getPaymentProvider() !== "none";
}

export async function verifyLocalPayment(userId: string): Promise<void> {
  if (getPaymentProvider() !== "local") {
    throw new Error("Локальная оплата недоступна в текущем режиме");
  }
  await db
    .update(users)
    .set({
      stripePaymentMethodId: LOCAL_METHOD_ID,
      paymentVerifiedAt: new Date(),
      stripeCustomerId: null,
    })
    .where(eq(users.id, userId));
}

export async function clearLocalPayment(userId: string): Promise<void> {
  await db
    .update(users)
    .set({
      stripePaymentMethodId: null,
      paymentVerifiedAt: null,
    })
    .where(eq(users.id, userId));
}

type DbClient = typeof db;

export async function isUserPaymentVerified(
  userId: string,
  role: string | undefined,
  client: DbClient = db,
): Promise<boolean> {
  if (!isPaymentRequired()) return true;
  if (role === "admin") return true;

  const [user] = await client
    .select({
      paymentVerifiedAt: users.paymentVerifiedAt,
      stripePaymentMethodId: users.stripePaymentMethodId,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user?.paymentVerifiedAt || !user.stripePaymentMethodId) return false;

  const provider = getPaymentProvider();
  if (provider === "local") {
    return user.stripePaymentMethodId === LOCAL_METHOD_ID;
  }
  if (provider === "stripe") {
    return user.stripePaymentMethodId !== LOCAL_METHOD_ID;
  }
  return true;
}

export type PaymentStatusResponse = {
  provider: PaymentProvider;
  verified: boolean;
  configured: boolean;
  brand?: string | null;
  last4?: string | null;
  label?: string;
};

export async function getPaymentStatus(userId: string): Promise<PaymentStatusResponse> {
  const provider = getPaymentProvider();

  if (provider === "none") {
    return { provider, verified: true, configured: false };
  }

  if (provider === "stripe") {
    const stripe = await getStripePaymentStatus(userId);
    return {
      provider: "stripe",
      verified: stripe.verified,
      configured: stripe.configured,
      brand: stripe.brand,
      last4: stripe.last4,
    };
  }

  const [user] = await db
    .select({
      paymentVerifiedAt: users.paymentVerifiedAt,
      stripePaymentMethodId: users.stripePaymentMethodId,
    })
    .from(users)
    .where(eq(users.id, userId));

  const verified = Boolean(
    user?.paymentVerifiedAt && user?.stripePaymentMethodId === LOCAL_METHOD_ID,
  );

  return {
    provider: "local",
    verified,
    configured: true,
    label: verified ? "Тестовый депозит подтверждён" : "Требуется тестовое подтверждение",
  };
}
