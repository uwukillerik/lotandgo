import { NextRequest } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, wallets, walletTransactions } from "@/lib/db/schema";
import { requireAdmin, handleApiError } from "@/lib/auth-request";
import { kopecksToRubles } from "@/lib/wallet-service";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const walletRows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        stripeCustomerId: users.stripeCustomerId,
        paymentVerifiedAt: users.paymentVerifiedAt,
        balanceKopecks: wallets.balanceKopecks,
      })
      .from(users)
      .leftJoin(wallets, eq(wallets.userId, users.id))
      .orderBy(desc(wallets.balanceKopecks))
      .limit(80);

    const recentTx = await db
      .select({
        id: walletTransactions.id,
        userName: users.name,
        type: walletTransactions.type,
        amountKopecks: walletTransactions.amountKopecks,
        createdAt: walletTransactions.createdAt,
      })
      .from(walletTransactions)
      .innerJoin(users, eq(walletTransactions.userId, users.id))
      .orderBy(desc(walletTransactions.createdAt))
      .limit(30);

    const verified = walletRows.filter((r) => r.paymentVerifiedAt);

    return Response.json({
      wallets: walletRows
        .filter((r) => r.balanceKopecks != null)
        .map((r) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          balanceRubles: kopecksToRubles(r.balanceKopecks ?? 0),
          paymentVerifiedAt: r.paymentVerifiedAt?.toISOString() ?? null,
        })),
      payments: verified.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        stripeCustomerId: r.stripeCustomerId,
        paymentVerifiedAt: r.paymentVerifiedAt?.toISOString() ?? null,
        balanceRubles: kopecksToRubles(r.balanceKopecks ?? 0),
      })),
      recentTransactions: recentTx.map((t) => ({
        ...t,
        amountRubles: kopecksToRubles(t.amountKopecks),
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
