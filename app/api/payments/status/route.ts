import { NextRequest } from "next/server";
import { requireUserId, handleApiError } from "@/lib/auth-request";
import { getPaymentStatus } from "@/lib/payments";

export async function GET(request: NextRequest) {
  try {
    const userId = requireUserId(request);
    const status = await getPaymentStatus(userId);
    return Response.json(status);
  } catch (error) {
    return handleApiError(error);
  }
}
