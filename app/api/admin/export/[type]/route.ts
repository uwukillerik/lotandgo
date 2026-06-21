import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, lots, auctions, bids, walletTransactions } from "@/lib/db/schema";
import { requireAdmin, handleApiError } from "@/lib/auth-request";

type Params = { params: Promise<{ type: string }> };

function csvEscape(value: unknown): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(","));
  }
  return "\uFEFF" + lines.join("\n");
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin(request);
    const { type } = await params;

    let csv = "";
    let filename = "export.csv";

    if (type === "users") {
      const rows = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          phone: users.phone,
          createdAt: users.createdAt,
        })
        .from(users);
      csv = toCsv(
        ["id", "email", "name", "role", "phone", "createdAt"],
        rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
      );
      filename = "lotgo-users.csv";
    } else if (type === "lots") {
      const rows = await db
        .select({
          id: lots.id,
          title: lots.title,
          category: lots.category,
          status: lots.status,
          sellerId: lots.sellerId,
          createdAt: lots.createdAt,
        })
        .from(lots);
      csv = toCsv(
        ["id", "title", "category", "status", "sellerId", "createdAt"],
        rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
      );
      filename = "lotgo-lots.csv";
    } else if (type === "payments") {
      const rows = await db
        .select({
          id: walletTransactions.id,
          userId: walletTransactions.userId,
          type: walletTransactions.type,
          amountKopecks: walletTransactions.amountKopecks,
          description: walletTransactions.description,
          auctionId: walletTransactions.auctionId,
          createdAt: walletTransactions.createdAt,
        })
        .from(walletTransactions);
      csv = toCsv(
        ["id", "userId", "type", "amountKopecks", "description", "auctionId", "createdAt"],
        rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
      );
      filename = "lotgo-payments.csv";
    } else if (type === "auctions") {
      const rows = await db
        .select({
          id: auctions.id,
          lotId: auctions.lotId,
          status: auctions.status,
          currentPrice: auctions.currentPrice,
          winnerId: auctions.winnerId,
          dealStatus: auctions.dealStatus,
          endsAt: auctions.endsAt,
        })
        .from(auctions);
      csv = toCsv(
        ["id", "lotId", "status", "currentPrice", "winnerId", "dealStatus", "endsAt"],
        rows.map((r) => ({ ...r, endsAt: r.endsAt.toISOString() })),
      );
      filename = "lotgo-auctions.csv";
    } else {
      return Response.json({ error: "Неизвестный тип экспорта" }, { status: 400 });
    }

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
