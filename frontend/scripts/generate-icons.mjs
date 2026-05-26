// Regenerate the favicon and app icons from `public/logo.png`.
//
// Outputs:
//   - src/app/favicon.ico   multi-resolution (16/32/48), <15 KB
//   - src/app/icon.png      256x256 PNG for modern browsers
//   - src/app/apple-icon.png 180x180 PNG for iOS home screen
//
// Run with: pnpm --filter @forgeng/frontend icons:generate

import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";
import pngToIco from "png-to-ico";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const SOURCE = resolve(root, "public/logo.png");
const OUT_FAVICON = resolve(root, "src/app/favicon.ico");
const OUT_ICON = resolve(root, "src/app/icon.png");
const OUT_APPLE = resolve(root, "src/app/apple-icon.png");

const FAVICON_SIZES = [16, 32, 48];
const ICON_SIZE = 256;
const APPLE_ICON_SIZE = 180;

async function resize(buffer, size) {
  return sharp(buffer)
    .resize(size, size, { fit: "cover" })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function main() {
  const source = await readFile(SOURCE);

  const [iconPng, applePng] = await Promise.all([
    resize(source, ICON_SIZE),
    resize(source, APPLE_ICON_SIZE),
  ]);
  await writeFile(OUT_ICON, iconPng);
  await writeFile(OUT_APPLE, applePng);

  const faviconPngs = await Promise.all(
    FAVICON_SIZES.map((size) => resize(source, size)),
  );
  const ico = await pngToIco(faviconPngs);
  await writeFile(OUT_FAVICON, ico);

  const sizes = {
    "favicon.ico": ico.length,
    "icon.png": iconPng.length,
    "apple-icon.png": applePng.length,
  };

  console.log("Generated icons from", SOURCE);
  for (const [name, bytes] of Object.entries(sizes)) {
    console.log(`  ${name.padEnd(16)} ${(bytes / 1024).toFixed(1)} KB`);
  }
}

main().catch((error) => {
  console.error("Failed to generate icons:", error);
  process.exit(1);
});
