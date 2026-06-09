import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";

export const uploadDir = process.env.UPLOAD_DIR ?? "./public/uploads";

const allowedMimes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
]);

export function ensureUploadDir(): void {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

export function getUploadUrl(filename: string): string {
  return `/uploads/${filename}`;
}

export async function saveUploadedFiles(
  files: File[],
): Promise<Array<{ filename: string; url: string }>> {
  ensureUploadDir();

  if (files.length === 0) {
    throw new Error("Загрузите хотя бы одно фото");
  }
  if (files.length > 5) {
    throw new Error("Максимум 5 фото");
  }

  const saved: Array<{ filename: string; url: string }> = [];

  for (const file of files) {
    if (!allowedMimes.has(file.type)) {
      throw new Error("Допустимы только JPEG, PNG, WebP");
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Файл слишком большой (макс. 5 МБ)");
    }

    const ext = path.extname(file.name).toLowerCase() || ".jpg";
    const filename = `${crypto.randomUUID()}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(uploadDir, filename), buffer);
    saved.push({ filename, url: getUploadUrl(filename) });
  }

  return saved;
}
