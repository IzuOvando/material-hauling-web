import { execFile } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const confirm = process.argv.includes("--confirm");
const removeTenantIndex = process.argv.indexOf("--remove-tenant");
const tenantToRemove = removeTenantIndex >= 0 ? process.argv[removeTenantIndex + 1] : undefined;
const assetPaths = [
  // logo_mexico.svg is intentionally excluded: the tenant logo is normalized into
  // tenant-assets/<tenant>/branding/logo.normalized.png, never into public/, so
  // there's nothing under public/ for a tenant install to have overwritten.
  "public/images/enterprises",
  "public/documents/test_metadatacamion.xlsx",
];

function printUsage(): void {
  console.error("Usage: npm run tenant:reset -- --confirm [--remove-tenant <tenant-folder>]");
  console.error("This restores the committed default public assets.");
  console.error("Use --remove-tenant only when you also want to delete a source tenant folder.");
}

async function runGit(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync("git", args, { cwd: process.cwd() });
  return stdout.trim();
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

  const changedAssets = await runGit(["status", "--short", "--", ...assetPaths]);
  if (changedAssets) {
    throw new Error(
      "Runtime assets have uncommitted changes. Commit or stash them before resetting.\n" + changedAssets,
    );
  }

  await runGit(["restore", "--source=HEAD", "--", ...assetPaths]);

  console.log("Default tenant assets restored:");
  assetPaths.forEach((assetPath) => console.log(`- ${assetPath}`));

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
  const trackedTenantFiles = await runGit(["ls-files", "--", `tenant-assets/${tenantToRemove}`]);
  if (trackedTenantFiles) {
    throw new Error(`Refusing to delete tracked tenant assets: tenant-assets/${tenantToRemove}`);
  }

  await fs.rm(tenantPath, { recursive: true, force: true });
  console.log(`Source tenant folder removed: tenant-assets/${tenantToRemove}`);
}

resetTenantAssets().catch((error: unknown) => {
  console.error(`Tenant asset reset failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
