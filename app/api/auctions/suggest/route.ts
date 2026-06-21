import { NextRequest } from "next/server";
import { ilike, eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { auctions, lots } from "@/lib/db/schema";
import { handleApiError } from "@/lib/auth-request";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) {
      return Response.json({ suggestions: [] });
    }

    const rows = await db
      .select({
        id: auctions.id,
        title: lots.title,
        category: lots.category,
        currentPrice: auctions.currentPrice,
        status: auctions.status,
      })
      .from(auctions)
      .innerJoin(lots, eq(auctions.lotId, lots.id))
      .where(
        and(
          ilike(lots.title, `%${q}%`),
          eq(auctions.status, "active"),
        ),
      )
      .limit(8);

    return Response.json({
      suggestions: rows.map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        currentPrice: r.currentPrice,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
