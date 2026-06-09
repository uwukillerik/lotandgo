import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { ensureUploadDir, uploadDir } from "./upload";

const avatarDir = path.join(uploadDir, "avatars");

export async function saveAvatarFile(file: File): Promise<string> {
  ensureUploadDir();
  if (!fs.existsSync(avatarDir)) {
    fs.mkdirSync(avatarDir, { recursive: true });
  }

  const ext = path.extname(file.name).toLowerCase();
  const allowedExt = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif"]);
  const allowedMime = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
    "image/gif",
    "image/heic",
    "image/heif",
    "application/octet-stream",
  ]);

  const mimeOk = !file.type || allowedMime.has(file.type);
  const extOk = allowedExt.has(ext);

  if (!mimeOk && !extOk) {
    throw new Error("Допустимы только JPEG, PNG, WebP");
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Аватар слишком большой (макс. 2 МБ)");
  }

  const safeExt = extOk ? ext : ".jpg";
  const filename = `${crypto.randomUUID()}${safeExt}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(avatarDir, filename), buffer);
  return `/uploads/avatars/${filename}`;
}
