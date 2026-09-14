// Usage: npm run generate:favicon-ico

import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const SIZE = 48;

const svg = readFileSync(path.join(dir, "..", "..", "static", "favicon.svg"), "utf-8");
const resvg = new Resvg(svg, { fitTo: { mode: "width", value: SIZE } });
const png = resvg.render().asPng();

const iconDir = Buffer.alloc(6);
iconDir.writeUInt16LE(0, 0); // reserved
iconDir.writeUInt16LE(1, 2); // type: 1 = icon
iconDir.writeUInt16LE(1, 4); // image count

const iconDirEntry = Buffer.alloc(16);
iconDirEntry.writeUInt8(SIZE, 0); // width
iconDirEntry.writeUInt8(SIZE, 1); // height
iconDirEntry.writeUInt8(0, 2); // color count (0 = not palette-based)
iconDirEntry.writeUInt8(0, 3); // reserved
iconDirEntry.writeUInt16LE(1, 4); // color planes
iconDirEntry.writeUInt16LE(32, 6); // bits per pixel
iconDirEntry.writeUInt32LE(png.length, 8); // size of PNG data
iconDirEntry.writeUInt32LE(iconDir.length + iconDirEntry.length, 12); // offset to PNG data

const ico = Buffer.concat([iconDir, iconDirEntry, png]);
const outPath = path.join(dir, "..", "..", "static", "favicon.ico");
writeFileSync(outPath, ico);

console.log(`Wrote ${outPath} (${ico.length} bytes)`);
