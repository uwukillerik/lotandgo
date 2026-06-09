import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";

const uploadDir = process.env.UPLOAD_DIR ?? "./uploads";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const allowedMimes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
]);

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    if (allowedMimes.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Допустимы только JPEG, PNG, WebP"));
    }
  },
});

export function getUploadUrl(filename: string): string {
  return `/uploads/${filename}`;
}

export { uploadDir };
