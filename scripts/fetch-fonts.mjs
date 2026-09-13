import { existsSync, mkdirSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const staticDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "static", "fonts");

const WEIGHTS = [500, 700, 800, 900];

async function fetchLatinWoff2Url(weight) {
  const css = await fetch(`https://fonts.bunny.net/css?family=sn-pro:${weight}`).then((res) => {
    if (!res.ok) throw new Error(`Bunny Fonts CSS request failed: ${res.status} ${res.statusText}`);
    return res.text();
  });

  const latinBlock = css.split("/* ").find((block) => block.startsWith("latin */") && !block.startsWith("latin-ext"));
  const [, url] = latinBlock?.match(/url\((https:\/\/[^)]+\.woff2)\)/) ?? [];
  if (!url) throw new Error(`Could not find a latin woff2 URL for SN Pro weight ${weight}`);

  return url;
}

async function downloadFont(weight) {
  const destPath = path.join(staticDir, `sn-pro-${weight}.woff2`);
  if (existsSync(destPath)) return;

  const url = await fetchLatinWoff2Url(weight);
  const bytes = await fetch(url).then((res) => {
    if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
    return res.arrayBuffer();
  });

  writeFileSync(destPath, Buffer.from(bytes));
  console.log(`Wrote ${destPath} (${bytes.byteLength} bytes)`);
}

async function downloadLicense() {
  const destPath = path.join(staticDir, "OFL.txt");
  if (existsSync(destPath)) return;

  const text = await fetch("https://raw.githubusercontent.com/google/fonts/main/ofl/snpro/OFL.txt").then((res) => {
    if (!res.ok) throw new Error(`Failed to download OFL.txt: ${res.status} ${res.statusText}`);
    return res.text();
  });

  writeFileSync(destPath, text);
  console.log(`Wrote ${destPath}`);
}

mkdirSync(staticDir, { recursive: true });
await Promise.all([...WEIGHTS.map(downloadFont), downloadLicense()]);
