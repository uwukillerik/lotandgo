import { eq } from "drizzle-orm";
import { db } from "./db";
import { auctions, lots, users } from "./db/schema";

export type ChatParticipant = {
  auctionId: string;
  sellerId: string;
  winnerId: string;
  isAdmin: boolean;
  isSeller: boolean;
  isWinner: boolean;
};

export async function getChatAccess(
  auctionId: string,
  userId: string,
): Promise<ChatParticipant | null> {
  const [row] = await db
    .select({
      status: auctions.status,
      winnerId: auctions.winnerId,
      sellerId: lots.sellerId,
      role: users.role,
    })
    .from(auctions)
    .innerJoin(lots, eq(auctions.lotId, lots.id))
    .innerJoin(users, eq(users.id, userId))
    .where(eq(auctions.id, auctionId));

  if (!row || row.status !== "ended" || !row.winnerId) return null;

  const isAdmin = row.role === "admin";
  const isSeller = row.sellerId === userId;
  const isWinner = row.winnerId === userId;

  if (!isAdmin && !isSeller && !isWinner) return null;

  return {
    auctionId,
    sellerId: row.sellerId,
    winnerId: row.winnerId,
    isAdmin,
    isSeller,
    isWinner,
  };
}
