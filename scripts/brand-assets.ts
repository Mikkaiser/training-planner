/**
 * Renders the app icons from the brand SVGs.
 *
 *   pnpm brand:assets
 *
 * A one-off rather than a build step: the logo changes about as often as the
 * company name, and a generated-at-build icon would mean the favicon depended
 * on sharp still resolving on whatever machine ran the deploy. The outputs are
 * committed; this exists so they can be regenerated identically rather than
 * hand-exported and slowly drifting.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const BRAND = join(ROOT, "public", "brand");
const APP = join(ROOT, "src", "app");

/** The logo's own ink, not the app's --ink. They are deliberately different. */
const BRAND_INK = "#1a1c16";

async function main(): Promise<void> {
  await mkdir(BRAND, { recursive: true });

  const appIcon = join(BRAND, "app-icon.svg");
  const lockupWhitePng = join(BRAND, "logo-lockup-white.png");

  // Next's file conventions. density is raised so the SVG is rasterised at the
  // target size rather than at its nominal 512 and then resampled.
  const icons: [string, number][] = [
    [join(APP, "icon.png"), 64],
    [join(APP, "apple-icon.png"), 180],
    [join(BRAND, "icon-192.png"), 192],
    [join(BRAND, "icon-512.png"), 512],
  ];

  for (const [out, size] of icons) {
    await sharp(appIcon, { density: 384 }).resize(size, size).png().toFile(out);
    console.log(`[brand] ${out.replace(ROOT + "/", "")} ${size}x${size}`);
  }

  // Link preview: the lockup centred on a brand-ink field. 1200x630 is what
  // Slack, Teams and WhatsApp crop to; anything else gets trimmed unevenly.
  //
  // Composed from the supplied PNG, not the SVG. The SVG's wordmark is set in
  // Space Grotesk, so rasterising it needs that font installed for librsvg —
  // and on a machine without it the text silently renders in a substitute
  // instead of failing. The PNG has the letterforms baked in, and its plaque is
  // exactly BRAND_INK, so it composites onto the field seamlessly.
  const lockup = await sharp(lockupWhitePng).resize({ width: 820 }).png().toBuffer();

  const og = await sharp({
    create: { width: 1200, height: 630, channels: 4, background: BRAND_INK },
  })
    .composite([{ input: lockup, gravity: "centre" }])
    .png()
    .toBuffer();

  const ogPath = join(APP, "opengraph-image.png");
  await writeFile(ogPath, og);
  console.log(`[brand] ${ogPath.replace(ROOT + "/", "")} 1200x630`);
}

main().catch((error: unknown) => {
  console.error(`[brand] FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
