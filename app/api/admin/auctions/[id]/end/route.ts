import { NextRequest } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/auth-request";
import { endAuction } from "@/lib/services/auctionEngine";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    await endAuction(id);
    return Response.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
