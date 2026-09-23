import { execFile } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const confirm = process.argv.includes("--confirm");
const removeTenantIndex = process.argv.indexOf("--remove-tenant");
const tenantToRemove = removeTenantIndex >= 0 ? process.argv[removeTenantIndex + 1] : undefined;

const DEFAULT_LOGO_FILENAME = "logo_mexico.svg";

const RESTORED_ASSET_PATHS = [
  // logo_mexico.svg is intentionally excluded: the tenant logo is normalized into
  // tenant-assets/<tenant>/branding/logo.normalized.png, never into public/, so
  // there's nothing under public/ for a tenant install to have overwritten.
  "public/images/enterprises",
  "public/documents/test_metadatacamion.xlsx",
];

function printUsage(): void {
  console.error("Usage: npm run tenant:reset -- --confirm [--remove-tenant <tenant-folder>]");
  console.error("This restores the committed default public assets and removes leftover per-tenant files.");
  console.error("Use --remove-tenant only when you also want to delete a source tenant folder.");
}

async function runGit(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync("git", args, { cwd: process.cwd() });
  return stdout.trim();
}

async function findLegacyTenantLogos(): Promise<string[]> {
  // An earlier version of tenant:install copied each tenant's logo into
  // public/images/logos/ as logo-<tenant>.<ext>. That pipeline is gone — logos are
  // now normalized into tenant-assets/ (see install-tenant-assets.ts), never public/ —
  // so any file still matching that old naming pattern is leftover cruft to remove.
  const logosDir = path.join(process.cwd(), "public", "images", "logos");
  let entries: string[];
  try {
    entries = await fs.readdir(logosDir);
  } catch {
    return [];
  }
  return entries
    .filter((name) => name !== DEFAULT_LOGO_FILENAME && /^logo-.+\.(svg|png|jpe?g|webp)$/i.test(name))
    .map((name) => path.posix.join("public/images/logos", name));
}

const GENERATED_BRANDING_FILES = ["logo.normalized.png", "favicon.png"];

async function findGeneratedBrandingFiles(): Promise<string[]> {
  const tenantAssetsDir = path.join(process.cwd(), "tenant-assets");
  let entries;
  try {
    entries = await fs.readdir(tenantAssetsDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const found: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    for (const fileName of GENERATED_BRANDING_FILES) {
      const candidate = path.join(tenantAssetsDir, entry.name, "branding", fileName);
      try {
        await fs.access(candidate);
        found.push(candidate);
      } catch {
        // not generated for this tenant — nothing to clean up
      }
    }
  }
  return found;
}

async function resetTenantAssets(): Promise<void> {
  if (!confirm) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const repositoryRoot = await runGit(["rev-parse", "--show-toplevel"]);
  if (repositoryRoot !== process.cwd()) {
    throw new Error("Run this command from the repository root.");
  }

  const legacyLogos = await findLegacyTenantLogos();
  const guardedPaths = [...RESTORED_ASSET_PATHS, ...legacyLogos];

  const changedAssets = await runGit(["status", "--short", "--", ...guardedPaths]);
  if (changedAssets) {
    throw new Error(
      "Runtime assets have uncommitted changes. Commit or stash them before resetting.\n" + changedAssets,
    );
  }

  await runGit(["restore", "--source=HEAD", "--", ...RESTORED_ASSET_PATHS]);
  console.log("Default tenant assets restored:");
  RESTORED_ASSET_PATHS.forEach((assetPath) => console.log(`- ${assetPath}`));

  if (legacyLogos.length > 0) {
    await runGit(["rm", "--quiet", "--", ...legacyLogos]);
    console.log("Removed leftover per-tenant logo file(s) from the old public/ pipeline (staged for commit):");
    legacyLogos.forEach((logoPath) => console.log(`- ${logoPath}`));
  }

  const generatedFiles = await findGeneratedBrandingFiles();
  if (generatedFiles.length > 0) {
    await Promise.all(generatedFiles.map((logoPath) => fs.rm(logoPath, { force: true })));
    console.log("Cleared generated logo/favicon file(s) (tenant:install regenerates these):");
    generatedFiles.forEach((logoPath) => console.log(`- ${path.relative(process.cwd(), logoPath)}`));
  }

  if (!tenantToRemove) {
    console.log("Source folders under tenant-assets/ were not changed.");
    return;
  }

  if (
    tenantToRemove === "." ||
    tenantToRemove === ".." ||
    tenantToRemove.includes("/") ||
    tenantToRemove.includes("\\")
  ) {
    throw new Error("Invalid tenant folder name.");
  }

  const tenantPath = path.join(process.cwd(), "tenant-assets", tenantToRemove);
  const tenantRelativePath = `tenant-assets/${tenantToRemove}`;
  const trackedTenantFiles = await runGit(["ls-files", "--", tenantRelativePath]);

  // This repo is a base template meant to be stripped and reconfigured per client —
  // a tenant folder committed here (even the shipped demo) isn't a "live" deployment
  // to protect, so --confirm plus explicitly naming the folder is guard enough.
  // Deleting a tracked folder goes through `git rm` so the removal is staged, same as
  // the legacy logo cleanup above; an untracked/scratch folder is just removed.
  if (trackedTenantFiles) {
    await runGit(["rm", "-r", "--quiet", "--", tenantRelativePath]);
    console.log(`Source tenant folder removed (staged for commit): ${tenantRelativePath}`);
  } else {
    await fs.rm(tenantPath, { recursive: true, force: true });
    console.log(`Source tenant folder removed: ${tenantRelativePath}`);
  }
}

resetTenantAssets().catch((error: unknown) => {
  console.error(`Tenant asset reset failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
