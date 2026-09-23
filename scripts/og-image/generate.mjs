// Regenerates static/og-image.png from scripts/og-image/og-image.svg.
//
// The SVG uses "SN Pro" (the site's display font, only shipped as a
// webfont), so this fetches the same font weights the site loads from
// Google Fonts and hands them to resvg as raster fonts.
//
// Usage: npm run generate:og-image

import { Resvg } from "@resvg/resvg-js";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { fileURLToPath } from "url";
import path from "path";

const dir = path.dirname(fileURLToPath(import.meta.url));

// Google Fonts serves plain .ttf files only to older user agents that don't
// support woff/woff2; modern browsers (and thus the site itself) get woff2.
const LEGACY_USER_AGENT =
  "Mozilla/5.0 (Linux; U; Android 2.2) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1";

async function fetchFontTtf(weight) {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=SN+Pro:wght@${weight}&display=swap`,
    { headers: { "User-Agent": LEGACY_USER_AGENT } },
  ).then((res) => res.text());

  const [, url] = css.match(/url\((https:\/\/[^)]+\.ttf)\)/) ?? [];
  if (!url) throw new Error(`Could not find a .ttf URL for SN Pro weight ${weight}`);

  return Buffer.from(await fetch(url).then((res) => res.arrayBuffer()));
}

const [snProExtraBold, snProRegular] = await Promise.all([fetchFontTtf(800), fetchFontTtf(400)]);

// @resvg/resvg-js's `fontBuffers` option doesn't reliably resolve custom
// family names, so the fetched fonts are written to disk and loaded via
// `fontFiles` instead.
const fontDir = mkdtempSync(path.join(tmpdir(), "og-image-fonts-"));
const extraBoldPath = path.join(fontDir, "SNPro-ExtraBold.ttf");
const regularPath = path.join(fontDir, "SNPro-Regular.ttf");
writeFileSync(extraBoldPath, snProExtraBold);
writeFileSync(regularPath, snProRegular);

const svg = readFileSync(path.join(dir, "og-image.svg"), "utf-8");

const resvg = new Resvg(svg, {
  fitTo: { mode: "width", value: 1200 },
  font: {
    fontFiles: [extraBoldPath, regularPath],
    loadSystemFonts: false,
    defaultFontFamily: "SN Pro",
  },
});

const png = resvg.render().asPng();
rmSync(fontDir, { recursive: true, force: true });

const outPath = path.join(dir, "..", "..", "static", "og-image.png");
writeFileSync(outPath, png);

console.log(`Wrote ${outPath} (${png.length} bytes)`);
