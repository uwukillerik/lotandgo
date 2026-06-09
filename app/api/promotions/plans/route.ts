import { NextRequest } from "next/server";
import { PROMOTION_PLANS } from "@/lib/promotion-config";
import { handleApiError } from "@/lib/auth-request";

export async function GET(_request: NextRequest) {
  try {
    return Response.json({ plans: PROMOTION_PLANS });
  } catch (error) {
    return handleApiError(error);
  }
}
