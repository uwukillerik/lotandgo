import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = [path.join(root, "mobile/assets/logo.png"), path.join(root, "public/logo.png")].find(
  (p) => fs.existsSync(p),
);

if (!src) {
  console.error("Logo not found. Place logo at public/logo.png or mobile/assets/logo.png");
  process.exit(1);
}

const outDir = path.join(root, "public/icons");
fs.mkdirSync(outDir, { recursive: true });

for (const size of [192, 512]) {
  const out = path.join(outDir, `icon-${size}.png`);
  await sharp(src).resize(size, size, { fit: "cover" }).png({ quality: 85 }).toFile(out);
  console.log(`Wrote ${out}`);
}
