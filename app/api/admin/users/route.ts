import { NextRequest } from "next/server";
import { eq, ilike, or, desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAdmin, handleApiError } from "@/lib/auth-request";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const search = request.nextUrl.searchParams.get("search") ?? "";

    const conditions = search
      ? or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`))
      : undefined;

    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        paymentVerifiedAt: users.paymentVerifiedAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(conditions)
      .orderBy(desc(users.createdAt))
      .limit(50);

    return Response.json({
      users: rows.map((u) => ({
        ...u,
        paymentVerified: u.paymentVerifiedAt != null,
        createdAt: u.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
