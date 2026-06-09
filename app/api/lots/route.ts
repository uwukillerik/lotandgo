import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { lots, lotImages } from "@/lib/db/schema";
import { createLotSchema } from "@shared/schemas";
import { requireUserId, handleApiError } from "@/lib/auth-request";
import { saveUploadedFiles } from "@/lib/upload";
import type { Lot } from "@shared/api";

export async function POST(request: NextRequest) {
  try {
    const userId = requireUserId(request);
    const formData = await request.formData();

    const parsed = createLotSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description"),
      category: formData.get("category"),
    });

    if (!parsed.success) {
      return Response.json(
        { error: "Ошибка валидации", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const imageFiles = formData
      .getAll("images")
      .filter((f): f is File => f instanceof File && f.size > 0);

    const saved = await saveUploadedFiles(imageFiles);
    const { title, description, category } = parsed.data;

    const [lot] = await db
      .insert(lots)
      .values({
        sellerId: userId,
        title,
        description,
        category,
        status: "draft",
      })
      .returning();

    const imageRows = await db
      .insert(lotImages)
      .values(
        saved.map((file, index) => ({
          lotId: lot.id,
          url: file.url,
          sortOrder: index,
        })),
      )
      .returning();

    const result: Lot = {
      id: lot.id,
      sellerId: lot.sellerId,
      title: lot.title,
      description: lot.description,
      category: lot.category as Lot["category"],
      status: lot.status,
      images: imageRows.map((img) => ({
        id: img.id,
        url: img.url,
        sortOrder: img.sortOrder,
      })),
      createdAt: lot.createdAt.toISOString(),
    };

    return Response.json({ lot: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
