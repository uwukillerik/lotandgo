import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { toPublicUser } from "@/lib/auth";
import { requireUserId, handleApiError } from "@/lib/auth-request";
import { saveAvatarFile } from "@/lib/avatar-upload";

export async function POST(request: NextRequest) {
  try {
    const userId = requireUserId(request);
    const formData = await request.formData();
    const file = formData.get("avatar");

    if (!(file instanceof File) || file.size === 0) {
      return Response.json({ error: "Выберите изображение" }, { status: 400 });
    }

    const avatarUrl = await saveAvatarFile(file);

    const [user] = await db
      .update(users)
      .set({ avatarUrl })
      .where(eq(users.id, userId))
      .returning();

    return Response.json({ user: toPublicUser(user) });
  } catch (error) {
    return handleApiError(error);
  }
}
