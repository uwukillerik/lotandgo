import { NextRequest } from "next/server";
import { requireUserId, handleApiError } from "@/lib/auth-request";
import { getWalletSummary, getWalletTransactions } from "@/lib/wallet-service";
import { getPaymentProvider } from "@/lib/payments";

export async function GET(request: NextRequest) {
  try {
    const userId = requireUserId(request);
    const summary = await getWalletSummary(userId);
    const transactions = await getWalletTransactions(userId);

    return Response.json({
      wallet: {
        ...summary,
        provider: getPaymentProvider(),
        mode: getPaymentProvider() === "local" ? "test" : getPaymentProvider(),
      },
      transactions,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
