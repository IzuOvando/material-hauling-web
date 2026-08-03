/**
 * Migration: resize existing logos in Vercel Blob to max 500px width.
 *
 * Logos uploaded before the resize-at-upload change may still be at full
 * resolution (e.g. 2250×2250 px). This script:
 *   1. Finds all frentes with a logoUrl in the database.
 *   2. Downloads each logo from Vercel Blob.
 *   3. Resizes it to ≤500 px width (maintaining aspect ratio) with sharp.
 *   4. Re-uploads the resized PNG to the same blob path.
 *   5. Updates logoHash and logoUpdatedAt in the database.
 *
 * Usage:
 *   npx ts-node --project tsconfig.json -e "require('./scripts/migrate-logos-resize.ts')"
 *   # or if you have dotenv-cli:
 *   dotenv -e .env -- npx ts-node scripts/migrate-logos-resize.ts
 *
 * Set DRY_RUN=true to preview without writing anything.
 */

import { createHash } from "crypto";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";

const prisma = new PrismaClient();
const DRY_RUN = process.env.DRY_RUN === "true";
const LOGO_MAX_WIDTH = 500;

async function downloadBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  console.log(`Logo resize migration — DRY_RUN=${DRY_RUN}\n`);

  const frentes = await prisma.frente.findMany({
    where: {
      logoUrl: { not: null },
      frenteKey: { not: null },
    },
    select: { nombre: true, frenteKey: true, logoUrl: true, logoHash: true },
  });

  console.log(`Found ${frentes.length} frente(s) with logos.\n`);

  let skipped = 0;
  let updated = 0;
  let failed = 0;

  for (const frente of frentes) {
    const { nombre, frenteKey, logoUrl, logoHash: existingHash } = frente;

    if (!logoUrl || !frenteKey) continue; // narrowing — already filtered above

    process.stdout.write(`[${frenteKey}] Downloading... `);

    let originalBuffer: Buffer;
    try {
      originalBuffer = await downloadBuffer(logoUrl);
    } catch (err) {
      console.error(`FAILED to download: ${err}`);
      failed++;
      continue;
    }

    let resizedBuffer: Buffer;
    let metadata: sharp.Metadata;
    try {
      const instance = sharp(originalBuffer);
      metadata = await instance.metadata();
      resizedBuffer = await instance
        .resize({ width: LOGO_MAX_WIDTH, withoutEnlargement: true })
        .png()
        .toBuffer();
    } catch (err) {
      console.error(`FAILED to resize: ${err}`);
      failed++;
      continue;
    }

    const newHash = createHash("sha256").update(resizedBuffer).digest("hex");

    if (newHash === existingHash) {
      console.log(`SKIPPED (hash unchanged, already ${metadata.width}px wide)`);
      skipped++;
      continue;
    }

    console.log(
      `${metadata.width}px → ≤${LOGO_MAX_WIDTH}px (${(originalBuffer.byteLength / 1024).toFixed(0)} KB → ${(resizedBuffer.byteLength / 1024).toFixed(0)} KB)`
    );

    if (DRY_RUN) {
      console.log(`  [DRY_RUN] Would upload and update DB for ${nombre}`);
      updated++;
      continue;
    }

    const blobPathname = `logos/${frenteKey}.png`;

    try {
      const result = await put(blobPathname, resizedBuffer, { access: "public" });

      await prisma.frente.update({
        where: { nombre },
        data: {
          logoUrl: result.url,
          logoHash: newHash,
          logoUpdatedAt: new Date(),
        },
      });

      console.log(`  Updated → ${result.url}`);
      updated++;
    } catch (err) {
      console.error(`  FAILED to upload/save: ${err}`);
      failed++;
    }
  }

  console.log(`\nDone. Updated: ${updated} | Skipped: ${skipped} | Failed: ${failed}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
