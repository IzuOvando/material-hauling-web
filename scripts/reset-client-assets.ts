import { execFile } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const confirm = process.argv.includes("--confirm");
const removeClientIndex = process.argv.indexOf("--remove-client");
const clientToRemove = removeClientIndex >= 0 ? process.argv[removeClientIndex + 1] : undefined;
const assetPaths = [
  "public/images/logos/logo_mexico.svg",
  "public/images/enterprises",
  "public/documents/test_metadatacamion.xlsx",
];

function printUsage(): void {
  console.error("Usage: npm run client:reset -- --confirm [--remove-client <client-folder>]");
  console.error("This restores the committed default public assets.");
  console.error("Use --remove-client only when you also want to delete a source client folder.");
}

async function runGit(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync("git", args, { cwd: process.cwd() });
  return stdout.trim();
}

async function resetClientAssets(): Promise<void> {
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

  console.log("Default client assets restored:");
  assetPaths.forEach((assetPath) => console.log(`- ${assetPath}`));

  if (!clientToRemove) {
    console.log("Source folders under client-assets/ were not changed.");
    return;
  }

  if (
    clientToRemove === "." ||
    clientToRemove === ".." ||
    clientToRemove.includes("/") ||
    clientToRemove.includes("\\")
  ) {
    throw new Error("Invalid client folder name.");
  }

  const clientPath = path.join(process.cwd(), "client-assets", clientToRemove);
  const trackedClientFiles = await runGit(["ls-files", "--", `client-assets/${clientToRemove}`]);
  if (trackedClientFiles) {
    throw new Error(`Refusing to delete tracked client assets: client-assets/${clientToRemove}`);
  }

  await fs.rm(clientPath, { recursive: true, force: true });
  console.log(`Source client folder removed: client-assets/${clientToRemove}`);
}

resetClientAssets().catch((error: unknown) => {
  console.error(`Client asset reset failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
