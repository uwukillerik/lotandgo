import { NextRequest } from "next/server";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  lots,
  lotImages,
  users,
  auctions,
  bids,
  wallets,
  auctionMessages,
} from "@/lib/db/schema";
import { LOT_CATEGORIES } from "@shared/categories";
import { requireAdmin, handleApiError } from "@/lib/auth-request";
import { kopecksToRubles } from "@/lib/wallet-service";
import { endAuction } from "@/lib/services/auctionEngine";
import { saveUploadedFiles } from "@/lib/upload";

const patchFieldsSchema = z.object({
  status: z.enum(["draft", "active", "ended", "sold"]).optional(),
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  category: z.enum(LOT_CATEGORIES).optional(),
  removeImageIds: z.array(z.string().uuid()).optional(),
});

function fieldOrUndefined(value: FormDataEntryValue | null): string | undefined {
  if (value == null) return undefined;
  const s = String(value).trim();
  return s || undefined;
}

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    const [row] = await db
      .select({
        id: lots.id,
        title: lots.title,
        description: lots.description,
        category: lots.category,
        status: lots.status,
        createdAt: lots.createdAt,
        sellerId: lots.sellerId,
        sellerName: users.name,
        sellerEmail: users.email,
        sellerPhone: users.phone,
      })
      .from(lots)
      .innerJoin(users, eq(lots.sellerId, users.id))
      .where(eq(lots.id, id));

    if (!row) return Response.json({ error: "Не найден" }, { status: 404 });

    const images = await db
      .select()
      .from(lotImages)
      .where(eq(lotImages.lotId, id))
      .orderBy(lotImages.sortOrder);

    const [auction] = await db
      .select()
      .from(auctions)
      .where(eq(auctions.lotId, id));

    const bidRows = auction
      ? await db
          .select({
            id: bids.id,
            amount: bids.amount,
            userName: users.name,
            createdAt: bids.createdAt,
          })
          .from(bids)
          .innerJoin(users, eq(bids.userId, users.id))
          .where(eq(bids.auctionId, auction.id))
          .orderBy(desc(bids.amount))
          .limit(20)
      : [];

    const [{ bidsCount }] = auction
      ? await db
          .select({ bidsCount: sql<number>`count(*)::int` })
          .from(bids)
          .where(eq(bids.auctionId, auction.id))
      : [{ bidsCount: 0 }];

    const [winner] =
      auction?.winnerId
        ? await db
            .select({ name: users.name, email: users.email })
            .from(users)
            .where(eq(users.id, auction.winnerId))
        : [];

    const [{ msgCount }] = auction
      ? await db
          .select({ msgCount: sql<number>`count(*)::int` })
          .from(auctionMessages)
          .where(eq(auctionMessages.auctionId, auction.id))
      : [{ msgCount: 0 }];

    const [sellerWallet] = await db
      .select({ balanceKopecks: wallets.balanceKopecks })
      .from(wallets)
      .where(eq(wallets.userId, row.sellerId));

    return Response.json({
      lot: {
        ...row,
        createdAt: row.createdAt.toISOString(),
        images: images.map((i) => ({ id: i.id, url: i.url, sortOrder: i.sortOrder })),
        sellerWalletRubles: sellerWallet ? kopecksToRubles(sellerWallet.balanceKopecks) : 0,
        auction: auction
          ? {
              id: auction.id,
              status: auction.status,
              startPrice: auction.startPrice,
              currentPrice: auction.currentPrice,
              bidStep: auction.bidStep,
              dealStatus: auction.dealStatus,
              startsAt: auction.startsAt.toISOString(),
              endsAt: auction.endsAt.toISOString(),
              winnerName: winner?.name ?? null,
              winnerEmail: winner?.email ?? null,
              bidsCount: bidsCount ?? 0,
              messagesCount: msgCount ?? 0,
              bids: bidRows.map((b) => ({
                ...b,
                createdAt: b.createdAt.toISOString(),
              })),
            }
          : null,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const contentType = request.headers.get("content-type") ?? "";

    let parsed: z.infer<typeof patchFieldsSchema>;
    let newImageFiles: File[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const removeRaw = formData.get("removeImageIds");
      let removeImageIds: string[] | undefined;
      if (removeRaw) {
        try {
          removeImageIds = JSON.parse(String(removeRaw));
        } catch {
          return Response.json({ error: "Некорректный removeImageIds" }, { status: 400 });
        }
      }

      const fieldResult = patchFieldsSchema.safeParse({
        status: fieldOrUndefined(formData.get("status")),
        title: fieldOrUndefined(formData.get("title")),
        description: fieldOrUndefined(formData.get("description")),
        category: fieldOrUndefined(formData.get("category")),
        removeImageIds,
      });
      if (!fieldResult.success) {
        return Response.json(
          { error: "Ошибка валидации", details: fieldResult.error.flatten() },
          { status: 400 },
        );
      }
      parsed = fieldResult.data;
      newImageFiles = formData
        .getAll("images")
        .filter((f): f is File => f instanceof File && f.size > 0);
    } else {
      const body = await request.json();
      const fieldResult = patchFieldsSchema.safeParse(body);
      if (!fieldResult.success) {
        return Response.json(
          { error: "Ошибка валидации", details: fieldResult.error.flatten() },
          { status: 400 },
        );
      }
      parsed = fieldResult.data;
    }

    const { status, title, description, category, removeImageIds } = parsed;
    if (!status && !title && !description && !category && !removeImageIds?.length && !newImageFiles.length) {
      return Response.json({ error: "Нет данных для обновления" }, { status: 400 });
    }

    const [existingLot] = await db.select({ id: lots.id }).from(lots).where(eq(lots.id, id));
    if (!existingLot) return Response.json({ error: "Не найден" }, { status: 404 });

    if (removeImageIds?.length || newImageFiles.length) {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(lotImages)
        .where(eq(lotImages.lotId, id));
      const afterRemove = (count ?? 0) - (removeImageIds?.length ?? 0) + newImageFiles.length;
      if (afterRemove > 5) {
        return Response.json({ error: "Максимум 5 фото на лот" }, { status: 400 });
      }
    }

    const endingLot = status === "ended" || status === "sold";
    const lotUpdates: Partial<typeof lots.$inferInsert> = {};
    if (status && !endingLot) lotUpdates.status = status;
    if (title) lotUpdates.title = title;
    if (description) lotUpdates.description = description;
    if (category) lotUpdates.category = category;

    const [auction] = await db
      .select({ id: auctions.id })
      .from(auctions)
      .where(eq(auctions.lotId, id));

    if (endingLot && auction) {
      if (Object.keys(lotUpdates).length > 0) {
        await db.update(lots).set(lotUpdates).where(eq(lots.id, id));
      }
      await endAuction(auction.id);
    } else {
      if (status && auction) {
        if (status === "active") {
          await db
            .update(auctions)
            .set({ status: "active", dealStatus: "none", winnerId: null })
            .where(eq(auctions.id, auction.id));
        } else if (status === "draft") {
          await db
            .update(auctions)
            .set({ status: "scheduled" })
            .where(eq(auctions.id, auction.id));
        }
      }
      if (Object.keys(lotUpdates).length > 0) {
        await db.update(lots).set(lotUpdates).where(eq(lots.id, id));
      }
    }

    if (removeImageIds?.length) {
      for (const imageId of removeImageIds) {
        await db.delete(lotImages).where(eq(lotImages.id, imageId));
      }
    }

    if (newImageFiles.length) {
      const saved = await saveUploadedFiles(newImageFiles);
      const existing = await db
        .select({ sortOrder: lotImages.sortOrder })
        .from(lotImages)
        .where(eq(lotImages.lotId, id))
        .orderBy(lotImages.sortOrder);
      let nextOrder = existing.length > 0 ? Math.max(...existing.map((i) => i.sortOrder)) + 1 : 0;
      for (const file of saved) {
        await db.insert(lotImages).values({
          lotId: id,
          url: file.url,
          sortOrder: nextOrder++,
        });
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    await requireAdmin(_request);
    const { id } = await params;
    await db.delete(lotImages).where(eq(lotImages.lotId, id));
    await db.delete(lots).where(eq(lots.id, id));
    return Response.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
