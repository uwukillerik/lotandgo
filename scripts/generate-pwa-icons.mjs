import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const srcCandidates = [
  path.join(root, "public/logo.png"),
  path.join(root, "mobile/assets/logo.png"),
  path.join(root, "public/icons/icon-512.png"),
  path.join(root, "public/icons/icon-192.png"),
];

const src = srcCandidates.find((p) => fs.existsSync(p));

if (!src) {
  console.error("Logo not found for icon generation.");
  process.exit(1);
}

const iconsDir = path.join(root, "public/icons");
fs.mkdirSync(iconsDir, { recursive: true });

for (const size of [192, 512]) {
  const out = path.join(iconsDir, `icon-${size}.png`);
  await sharp(src).resize(size, size, { fit: "cover" }).png({ quality: 90 }).toFile(out);
  console.log(`Wrote ${out}`);
}

for (const size of [16, 32]) {
  const out = path.join(iconsDir, `favicon-${size}.png`);
  await sharp(src).resize(size, size, { fit: "cover" }).png({ quality: 90 }).toFile(out);
  console.log(`Wrote ${out}`);
}

const faviconIco = path.join(root, "public/favicon.ico");
await sharp(src).resize(32, 32, { fit: "cover" }).png().toFile(faviconIco);
console.log(`Wrote ${faviconIco}`);

const appleTouch = path.join(iconsDir, "apple-touch-icon.png");
await sharp(src).resize(180, 180, { fit: "cover" }).png({ quality: 90 }).toFile(appleTouch);
console.log(`Wrote ${appleTouch}`);
