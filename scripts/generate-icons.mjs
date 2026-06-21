// Generates PWA app icons (pure Node, no image libraries).
// Draws a shopping-bag glyph on an indigo gradient. Run: node scripts/generate-icons.mjs
import zlib from "node:zlib";
import fs from "node:fs";
import path from "node:path";

const OUT_DIR = path.join(process.cwd(), "public", "icons");
fs.mkdirSync(OUT_DIR, { recursive: true });

// --- minimal PNG encoder ---------------------------------------------------
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

// --- glyph drawing ---------------------------------------------------------
function inRoundRect(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || x >= x1 || y < y0 || y >= y1) return false;
  const nx = Math.min(Math.max(x, x0 + r), x1 - r);
  const ny = Math.min(Math.max(y, y0 + r), y1 - r);
  const dx = x - nx, dy = y - ny;
  return dx * dx + dy * dy <= r * r;
}

function makeIcon(size) {
  const S = size;
  const rgba = Buffer.alloc(S * S * 4);
  const set = (x, y, r, g, b, a = 255) => {
    const i = (y * S + x) * 4;
    rgba[i] = r; rgba[i + 1] = g; rgba[i + 2] = b; rgba[i + 3] = a;
  };

  // vertical gradient: #6366f1 -> #4338ca
  for (let y = 0; y < S; y++) {
    const t = y / (S - 1);
    const r = Math.round(99 + (67 - 99) * t);
    const g = Math.round(102 + (56 - 102) * t);
    const b = Math.round(241 + (202 - 241) * t);
    for (let x = 0; x < S; x++) set(x, y, r, g, b, 255);
  }

  // bag body + handle (kept within the maskable safe area)
  const bx0 = 0.30 * S, bx1 = 0.70 * S, by0 = 0.42 * S, by1 = 0.78 * S, rad = 0.06 * S;
  const hx = 0.5 * S, hy = by0, Ro = 0.135 * S, Ri = 0.092 * S;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      let white = false;
      if (inRoundRect(x, y, bx0, by0, bx1, by1, rad)) white = true;
      if (!white && y <= hy) {
        const dx = x - hx, dy = y - hy, d2 = dx * dx + dy * dy;
        if (d2 <= Ro * Ro && d2 >= Ri * Ri) white = true; // handle ring (top half)
      }
      if (white) set(x, y, 255, 255, 255, 255);
    }
  }
  return encodePNG(S, S, rgba);
}

const targets = [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["icon-512-maskable.png", 512],
  ["apple-touch-icon.png", 180],
];
for (const [name, size] of targets) {
  fs.writeFileSync(path.join(OUT_DIR, name), makeIcon(size));
  console.log(`✔ ${name} (${size}x${size})`);
}
console.log("Done. Icons written to public/icons/");
