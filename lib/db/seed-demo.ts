import "dotenv/config";
import { eq, and } from "drizzle-orm";
import { db } from "./index";
import { users, lots, lotImages, auctions, bids, lotPromotions, favorites, notifications, auctionMessages } from "./schema";
import { ensureDemoLegalConsent } from "./ensure-demo-consent";
import { testDeposit } from "../wallet-service";

const DEMO_LOTS = [
  {
    title: "Ваза Мейсен XVIII века",
    description: "Фарфоровая ваза в отличном состоянии, клеймо мануфактуры сохранено.",
    category: "Антиквариат",
    imageUrl: "https://images.unsplash.com/photo-1578504935244-9457d9db3a44?w=600&q=80",
    status: "active" as const,
    hoursToEnd: 3,
    startPrice: 85_000,
    bidStep: 3_000,
    bids: [
      { bidder: "bidder1@lotgo.ru", amount: 88_000 },
      { bidder: "bidder2@lotgo.ru", amount: 91_000 },
      { bidder: "bidder1@lotgo.ru", amount: 94_000 },
    ],
  },
  {
    title: "Картина «Осенний этюд», масло, 1960-е",
    description: "Работа московского художника, подпись на обороте, рама оригинальная.",
    category: "Живопись",
    imageUrl: "https://images.unsplash.com/photo-1579783902610-e75fb1f9b78e?w=600&q=80",
    status: "active" as const,
    hoursToEnd: 8,
    startPrice: 42_000,
    bidStep: 2_000,
    bids: [
      { bidder: "bidder2@lotgo.ru", amount: 44_000 },
      { bidder: "bidder1@lotgo.ru", amount: 46_000 },
    ],
  },
  {
    title: "Комплект столовых приборов серебро 84 пробы",
    description: "12 персон, гравировка монограммы, хранился в футляре.",
    category: "Коллекции",
    imageUrl: "https://images.unsplash.com/photo-1610701596007-6a2494f90cdb?w=600&q=80",
    status: "scheduled" as const,
    hoursToStart: 6,
    hoursToEnd: 30,
    startPrice: 120_000,
    bidStep: 5_000,
    bids: [] as { bidder: string; amount: number }[],
  },
  {
    title: "Платок Hermès «Brides de Gala»",
    description: "Шёлк, лимитированная серия, сертификат подлинности.",
    category: "Украшения",
    imageUrl: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&q=80",
    status: "scheduled" as const,
    hoursToStart: 24,
    hoursToEnd: 48,
    startPrice: 65_000,
    bidStep: 2_500,
    bids: [],
  },
  {
    title: "Кресло Chesterfield, кожа, Англия",
    description: "Классическое кожаное кресло, реставрация 2019 года.",
    category: "Мебель",
    imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80",
    status: "ended" as const,
    hoursSinceEnd: 12,
    startPrice: 55_000,
    bidStep: 2_000,
    bids: [
      { bidder: "bidder1@lotgo.ru", amount: 57_000 },
      { bidder: "bidder2@lotgo.ru", amount: 59_000 },
      { bidder: "bidder1@lotgo.ru", amount: 61_000 },
      { bidder: "bidder2@lotgo.ru", amount: 63_000 },
    ],
    winner: "bidder2@lotgo.ru",
  },
  {
    title: "Настенные часы Gustav Becker",
    description: "Маятниковые часы конца XIX века, механизм на ходу.",
    category: "Антиквариат",
    imageUrl: "https://images.unsplash.com/photo-1563861829036-d169df070cee?w=600&q=80",
    status: "ended" as const,
    hoursSinceEnd: 48,
    startPrice: 38_000,
    bidStep: 1_500,
    bids: [
      { bidder: "bidder2@lotgo.ru", amount: 39_500 },
      { bidder: "bidder1@lotgo.ru", amount: 41_000 },
    ],
    winner: "bidder1@lotgo.ru",
  },
];

const GALLERY_LOT_TITLE = "Сервиз императорского фарфора — коллекция (5 фото)";

const GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1578504935244-9457d9db3a44?w=800&q=80",
  "https://images.unsplash.com/photo-1610701596007-6a2494f90cdb?w=800&q=80",
  "https://images.unsplash.com/photo-1565193566179-0e4e2d0c8e2e?w=800&q=80",
  "https://images.unsplash.com/photo-1586075010923-2dd4578fb118?w=800&q=80",
  "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&q=80",
];

async function seedGalleryLot(
  sellerId: string,
  bidderMap: Map<string, string>,
  now: number,
) {
  const [exists] = await db
    .select({ id: lots.id })
    .from(lots)
    .where(eq(lots.title, GALLERY_LOT_TITLE))
    .limit(1);

  if (exists) {
    console.log(`  галерея уже есть: ${GALLERY_LOT_TITLE}`);
    const [activePromo] = await db
      .select({ id: lotPromotions.id })
      .from(lotPromotions)
      .where(eq(lotPromotions.lotId, exists.id))
      .limit(1);
    if (!activePromo) {
      await db.insert(lotPromotions).values({
        lotId: exists.id,
        tier: "premium",
        priceRubles: 999,
        startsAt: new Date(now),
        expiresAt: new Date(now + 14 * 24 * 3600_000),
      });
      console.log("  + premium-продвижение для галереи");
    }
    return;
  }

  const [lot] = await db
    .insert(lots)
    .values({
      sellerId,
      title: GALLERY_LOT_TITLE,
      description:
        "Редкий фарфоровый сервиз XVIII века: чайник, сахарница, шесть чашек и блюдца. " +
        "Полная комплектация, клейма мануфактуры на каждом предмете. " +
        "На фото — общий вид, детали росписи, клейма, состояние золочения и комплектность.",
      category: "Антиквариат",
      status: "active",
    })
    .returning();

  for (let i = 0; i < GALLERY_IMAGES.length; i++) {
    await db.insert(lotImages).values({
      lotId: lot.id,
      url: GALLERY_IMAGES[i],
      sortOrder: i,
    });
  }

  const startsAt = new Date(now - 3600_000);
  const endsAt = new Date(now + 24 * 3600_000);

  const [auction] = await db
    .insert(auctions)
    .values({
      lotId: lot.id,
      startPrice: 180_000,
      bidStep: 5_000,
      currentPrice: 195_000,
      status: "active",
      startsAt,
      endsAt,
    })
    .returning();

  for (const [bidder, amount] of [
    ["bidder1@lotgo.ru", 185_000],
    ["bidder2@lotgo.ru", 190_000],
    ["bidder1@lotgo.ru", 195_000],
  ] as const) {
    const userId = bidderMap.get(bidder);
    if (!userId) continue;
    await db.insert(bids).values({
      auctionId: auction.id,
      userId,
      amount,
      createdAt: new Date(now - 30 * 60_000),
    });
  }

  await db.insert(lotPromotions).values({
    lotId: lot.id,
    tier: "premium",
    priceRubles: 999,
    startsAt: new Date(now),
    expiresAt: new Date(now + 14 * 24 * 3600_000),
  });

  console.log(`  + [gallery+premium] ${GALLERY_LOT_TITLE}`);
}

async function seedMarketExtras(
  sellerId: string,
  bidderMap: Map<string, string>,
  now: number,
) {
  const chesterTitle = "Кресло Chesterfield, кожа, Англия";
  const [chesterLot] = await db
    .select({ id: lots.id })
    .from(lots)
    .where(eq(lots.title, chesterTitle))
    .limit(1);

  if (chesterLot) {
    const [chesterAuction] = await db
      .select()
      .from(auctions)
      .where(eq(auctions.lotId, chesterLot.id))
      .limit(1);

    if (chesterAuction && chesterAuction.winnerId) {
      const [hasDeal] = await db
        .select({ id: auctionMessages.id })
        .from(auctionMessages)
        .where(eq(auctionMessages.auctionId, chesterAuction.id))
        .limit(1);

      if (!hasDeal) {
        await db
          .update(auctions)
          .set({ dealStatus: "awaiting_payment" })
          .where(eq(auctions.id, chesterAuction.id));

        await db.insert(auctionMessages).values([
          {
            auctionId: chesterAuction.id,
            senderId: chesterAuction.winnerId,
            body: "Здравствуйте! Готов оплатить лот. Как удобнее перевести?",
            createdAt: new Date(now - 2 * 3600_000),
          },
          {
            auctionId: chesterAuction.id,
            senderId: sellerId,
            body: "Добрый день! Можно через кошелёк на платформе или переводом.",
            createdAt: new Date(now - 3600_000),
          },
        ]);

        await db.insert(notifications).values([
          {
            userId: chesterAuction.winnerId,
            type: "won",
            auctionId: chesterAuction.id,
            message: `Вы победили в торгах «${chesterTitle}»`,
          },
          {
            userId: sellerId,
            type: "auction_end",
            auctionId: chesterAuction.id,
            message: `Аукцион «${chesterTitle}» завершён с победителем`,
          },
        ]);
        console.log("  + чат и уведомления для завершённого лота");
      }
    }
  }

  const bidder1 = bidderMap.get("bidder1@lotgo.ru");
  const [activeAuction] = await db
    .select({ id: auctions.id })
    .from(auctions)
    .where(eq(auctions.status, "active"))
    .limit(1);

  if (bidder1 && activeAuction) {
    const [fav] = await db
      .select({ id: favorites.id })
      .from(favorites)
      .where(and(eq(favorites.userId, bidder1), eq(favorites.auctionId, activeAuction.id)))
      .limit(1);
    if (!fav) {
      await db.insert(favorites).values({ userId: bidder1, auctionId: activeAuction.id });
      console.log("  + избранное для bidder1");
    }
  }
}

async function seedDemo() {
  console.log("Добавляем демо-аукционы…");
  await ensureDemoLegalConsent();

  const [seller] = await db
    .select()
    .from(users)
    .where(eq(users.email, "seller@lotgo.ru"))
    .limit(1);

  if (!seller) {
    console.error("Сначала выполните: npm run db:seed");
    process.exit(1);
  }

  const bidderMap = new Map<string, string>();
  for (const email of ["bidder1@lotgo.ru", "bidder2@lotgo.ru"]) {
    const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (u) bidderMap.set(email, u.id);
  }

  const now = Date.now();
  let added = 0;

  for (const item of DEMO_LOTS) {
    const [exists] = await db
      .select({ id: lots.id })
      .from(lots)
      .where(eq(lots.title, item.title))
      .limit(1);

    if (exists) {
      console.log(`  пропуск (уже есть): ${item.title}`);
      continue;
    }

    const [lot] = await db
      .insert(lots)
      .values({
        sellerId: seller.id,
        title: item.title,
        description: item.description,
        category: item.category,
        status: item.status === "ended" ? "ended" : "active",
      })
      .returning();

    await db.insert(lotImages).values({
      lotId: lot.id,
      url: item.imageUrl,
      sortOrder: 0,
    });

    let startsAt: Date;
    let endsAt: Date;

    if (item.status === "scheduled") {
      startsAt = new Date(now + (item.hoursToStart ?? 0) * 3600_000);
      endsAt = new Date(now + (item.hoursToEnd ?? 24) * 3600_000);
    } else if (item.status === "ended") {
      endsAt = new Date(now - (item.hoursSinceEnd ?? 1) * 3600_000);
      startsAt = new Date(endsAt.getTime() - 48 * 3600_000);
    } else {
      startsAt = new Date(now - 3600_000);
      endsAt = new Date(now + (item.hoursToEnd ?? 2) * 3600_000);
    }

    const currentPrice =
      item.bids.length > 0
        ? item.bids[item.bids.length - 1].amount
        : item.startPrice;

    const winnerId =
      item.status === "ended" && item.winner
        ? bidderMap.get(item.winner) ?? null
        : null;

    const [auction] = await db
      .insert(auctions)
      .values({
        lotId: lot.id,
        startPrice: item.startPrice,
        bidStep: item.bidStep,
        currentPrice,
        status: item.status,
        startsAt,
        endsAt,
        winnerId,
      })
      .returning();

    for (const b of item.bids) {
      const userId = bidderMap.get(b.bidder);
      if (!userId) continue;
      await db.insert(bids).values({
        auctionId: auction.id,
        userId,
        amount: b.amount,
        createdAt: new Date(startsAt.getTime() + Math.random() * (endsAt.getTime() - startsAt.getTime())),
      });
    }

    console.log(`  + [${item.status}] ${item.title} — ${currentPrice.toLocaleString("ru-RU")} ₽`);
    added++;
  }

  await seedGalleryLot(seller.id, bidderMap, now);
  await seedMarketExtras(seller.id, bidderMap, now);

  try {
    await testDeposit(seller.id, 10_000);
    console.log("  кошелёк seller@lotgo.ru пополнен на 10 000 ₽ (для теста продвижения)");
  } catch {
    /* уже достаточно баланса */
  }

  console.log(`\nГотово: добавлено ${added} лотов + галерея. Откройте /catalog`);
}

seedDemo()
  .catch(console.error)
  .finally(() => process.exit(0));
