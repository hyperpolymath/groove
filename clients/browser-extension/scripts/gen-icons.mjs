// SPDX-License-Identifier: MPL-2.0
// Copyright (c) 2026 Jonathan D.A. Jewell <j.d.a.jewell@open.ac.uk>
//
// Generates icons/groove-48.png and icons/groove-96.png: a dark rounded tile
// with two light "groove" slots. Pure node (zlib + hand-rolled CRC32) so the
// icons are reproducible without image tooling.
//
// Usage: node scripts/gen-icons.mjs

import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(here, "..", "icons");

const CRC_TABLE = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** Build an RGBA PNG from a pixel callback (x, y) -> [r, g, b, a]. */
function png(size, pixel) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    raw[row] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x, y);
      raw.set([r, g, b, a], row + 1 + x * 4);
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Dark rounded tile with two lighter horizontal groove slots. */
function grooveIcon(size) {
  const bg = [30, 41, 59]; // slate-800
  const slot = [96, 165, 250]; // blue-400
  const radius = size / 8;
  const slotH = Math.max(2, Math.round(size / 12));
  const slotY1 = Math.round(size * 0.33);
  const slotY2 = Math.round(size * 0.58);
  const slotX1 = Math.round(size * 0.2);
  const slotX2a = Math.round(size * 0.8); // top slot: long
  const slotX2b = Math.round(size * 0.6); // bottom slot: short (the dial)

  return png(size, (x, y) => {
    // Rounded-corner transparency.
    const cx = x < radius ? radius : x >= size - radius ? size - radius - 1 : x;
    const cy = y < radius ? radius : y >= size - radius ? size - radius - 1 : y;
    if ((x - cx) ** 2 + (y - cy) ** 2 > radius ** 2) return [0, 0, 0, 0];

    if (y >= slotY1 && y < slotY1 + slotH && x >= slotX1 && x < slotX2a) {
      return [...slot, 255];
    }
    if (y >= slotY2 && y < slotY2 + slotH && x >= slotX1 && x < slotX2b) {
      return [...slot, 255];
    }
    return [...bg, 255];
  });
}

mkdirSync(iconsDir, { recursive: true });
for (const size of [48, 96]) {
  const path = join(iconsDir, `groove-${size}.png`);
  writeFileSync(path, grooveIcon(size));
  console.log(`wrote ${path}`);
}
