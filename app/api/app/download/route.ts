import { NextRequest } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { APK_DOWNLOAD_PATH } from "@shared/site-url";

const apkPath = path.resolve(process.cwd(), "public/downloads/lotgo.apk");

export async function GET(_request: NextRequest) {
  const exists = fs.existsSync(apkPath);
  let sizeBytes = 0;
  if (exists) {
    sizeBytes = fs.statSync(apkPath).size;
  }

  return Response.json({
    apk: {
      available: exists,
      url: exists ? APK_DOWNLOAD_PATH : null,
      sizeBytes,
      sizeMb: exists ? Math.round((sizeBytes / (1024 * 1024)) * 10) / 10 : null,
      buildHint: exists ? null : "Соберите локально: pnpm build:apk, затем scripts/upload-apk",
    },
  });
}
