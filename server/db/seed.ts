import "dotenv/config";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { users, lots, lotImages, auctions } from "./schema";

async function seed() {
  console.log("Seeding database...");

  const existing = await db.select({ id: users.id }).from(users).limit(1);
  if (existing.length > 0) {
    console.log("Database already seeded, skipping.");
    return;
  }

  const passwordHash = await bcrypt.hash("Demo123456", 12);

  const [seller, bidder1, bidder2] = await db
    .insert(users)
    .values([
      {
        email: "seller@lotgo.ru",
        passwordHash,
        name: "Алексей Продавец",
        phone: "+7 900 111-22-33",
      },
      {
        email: "bidder1@lotgo.ru",
        passwordHash,
        name: "Мария Покупатель",
        phone: "+7 900 444-55-66",
      },
      {
        email: "bidder2@lotgo.ru",
        passwordHash,
        name: "Иван Коллекционер",
        phone: "+7 900 777-88-99",
      },
    ])
    .returning();

  const lotData = [
    {
      sellerId: seller.id,
      title: "Письменный стол красного дерева XVII века",
      description:
        "Аутентичный письменный стол из красного дерева. Сохранился в отличном состоянии, все фурнитура оригинальная.",
      category: "Мебель",
      imageUrl: "/uploads/seed-desk.jpg",
    },
    {
      sellerId: seller.id,
      title: "Карманные часы Patek Philippe 1920 года",
      description:
        "Редкие карманные часы в рабочем состоянии. Механизм обслужен, есть документы о происхождении.",
      category: "Антиквариат",
      imageUrl: "/uploads/seed-watch.jpg",
    },
    {
      sellerId: seller.id,
      title: "Колье с аметистами Art Deco",
      description:
        "Украшение эпохи Art Deco, серебро 925 пробы, натуральные аметисты.",
      category: "Украшения",
      imageUrl: "/uploads/seed-jewelry.jpg",
    },
  ];

  const now = new Date();
  const in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const in5h = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  const in1d = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  for (let i = 0; i < lotData.length; i++) {
    const data = lotData[i];
    const [lot] = await db
      .insert(lots)
      .values({
        sellerId: data.sellerId,
        title: data.title,
        description: data.description,
        category: data.category,
        status: "active",
      })
      .returning();

    await db.insert(lotImages).values({
      lotId: lot.id,
      url: data.imageUrl,
      sortOrder: 0,
    });

    const endsAt = i === 0 ? in2h : i === 1 ? in5h : in1d;
    const startPrice = i === 0 ? 35000 : i === 1 ? 120000 : 45000;
    const bidStep = i === 0 ? 1000 : i === 1 ? 5000 : 2000;

    await db.insert(auctions).values({
      lotId: lot.id,
      startPrice,
      bidStep,
      currentPrice: startPrice,
      status: "active",
      startsAt: now,
      endsAt,
    });
  }

  console.log("Seed complete!");
  console.log("Demo accounts (password: Demo123456):");
  console.log("  seller@lotgo.ru");
  console.log("  bidder1@lotgo.ru");
  console.log("  bidder2@lotgo.ru");
}

seed()
  .catch(console.error)
  .finally(() => process.exit(0));
