/**
 * Generate real PNG icons + carousel for alexa-addon (no example.com placeholders).
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "alexa-addon", "assets");
mkdirSync(outDir, { recursive: true });

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function pngRGB(width, height, pixelFn) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 3 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixelFn(x, y, width, height);
      const i = row + 1 + x * 3;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function hearthPixel(x, y, w, h) {
  const cx = w / 2;
  const cy = h * 0.42;
  const dx = (x - cx) / (w * 0.28);
  const dy = (y - cy) / (h * 0.28);
  const inGlow = dx * dx + dy * dy < 1.1;
  const warm = y > h * 0.55 && Math.abs(x - cx) < w * 0.22;
  if (inGlow) return [240, 164, 92];
  if (warm) return [126, 181, 154];
  return [28, 22, 18];
}

const sizes = [64, 72, 88, 126, 180, 241];
for (const s of sizes) {
  const buf = pngRGB(s, s, hearthPixel);
  writeFileSync(join(outDir, `icon-${s}.png`), buf);
}

writeFileSync(join(outDir, "carousel-600x900.png"), pngRGB(600, 900, hearthPixel));

console.log(`Wrote icons + carousel to ${outDir}`);
