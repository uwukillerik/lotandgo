import "dotenv/config";
import { eq, like } from "drizzle-orm";
import { db } from "./index";
import { lotImages } from "./schema";

const REPLACEMENTS: Record<string, string> = {
  "/uploads/seed-desk.jpg":
    "https://images.unsplash.com/photo-1578504935244-9457d9db3a44?w=800&q=80",
  "/uploads/seed-watch.jpg":
    "https://images.unsplash.com/photo-1579783902610-e75fb1f9b78e?w=800&q=80",
  "/uploads/seed-jewelry.jpg":
    "https://images.unsplash.com/photo-1610701596007-6a2494f90cdb?w=800&q=80",
};

async function fixSeedImages() {
  console.log("Исправление URL демо-картинок…");

  let updated = 0;
  for (const [oldUrl, newUrl] of Object.entries(REPLACEMENTS)) {
    const rows = await db
      .update(lotImages)
      .set({ url: newUrl })
      .where(eq(lotImages.url, oldUrl))
      .returning({ id: lotImages.id });
    updated += rows.length;
    console.log(`  ${oldUrl} → ${rows.length} записей`);
  }

  const leftovers = await db
    .select({ id: lotImages.id, url: lotImages.url })
    .from(lotImages)
    .where(like(lotImages.url, "/uploads/seed-%"));

  if (leftovers.length > 0) {
    console.log(`  Осталось ${leftovers.length} локальных seed-URL — проверьте вручную`);
  }

  console.log(`Готово. Обновлено: ${updated}`);
}

fixSeedImages()
  .catch(console.error)
  .finally(() => process.exit(0));
