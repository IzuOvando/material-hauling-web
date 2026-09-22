import { promises as fs } from "fs";
import path from "path";
import { spawn } from "child_process";

const projectRoot = process.cwd();
const scriptArgs = process.argv.slice(2);
const startApp = !scriptArgs.includes("--no-start");
const tenantName = scriptArgs.find((arg) => !arg.startsWith("--"));

const allowedImageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg"]);

function printUsage(): void {
  console.error("Usage: npm run tenant:install -- <tenant-folder> [--no-start]");
  console.error("Example: npm run tenant:install -- atlas");
}

async function ensureFile(filePath: string, label: string): Promise<void> {
  try {
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) throw new Error();
  } catch {
    throw new Error(`Missing ${label}: ${path.relative(projectRoot, filePath)}`);
  }
}

async function findOptionalFile(filePath: string): Promise<string | null> {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile() ? filePath : null;
  } catch {
    return null;
  }
}

async function getEnterpriseImages(folder: string): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(folder, { withFileTypes: true });
  } catch {
    throw new Error(`Missing enterprise images folder: ${path.relative(projectRoot, folder)}`);
  }

  const images = entries
    .filter((entry) => entry.isFile() && allowedImageExtensions.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name);

  if (images.length === 0) {
    throw new Error(`No supported images found in ${path.relative(projectRoot, folder)}`);
  }

  return images;
}

async function copyFile(source: string, destination: string): Promise<void> {
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.copyFile(source, destination);
}

async function installTenantAssets(): Promise<void> {
  if (!tenantName || tenantName.includes("/") || tenantName.includes("\\") || tenantName === "." || tenantName === "..") {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const sourceRoot = path.join(projectRoot, "tenant-assets", tenantName);
  const brandingSource = path.join(sourceRoot, "branding", "logo.svg");
  const enterprisesSource = path.join(sourceRoot, "enterprises");
  const qrTemplateSource = path.join(sourceRoot, "documents", "qr-template.xlsx");

  await ensureFile(brandingSource, "branding logo");
  await ensureFile(path.join(sourceRoot, "tenant.json"), "tenant config");
  const availableQrTemplate = await findOptionalFile(qrTemplateSource);
  const enterpriseImages = await getEnterpriseImages(enterprisesSource);

  const publicRoot = path.join(projectRoot, "public");
  // The default logo (logo_mexico.svg) is never overwritten — each tenant gets its own
  // file so the repository default always stays available as a fallback.
  const logoFileName = `logo-${tenantName}.svg`;
  const logoDestination = path.join(publicRoot, "images", "logos", logoFileName);
  await copyFile(brandingSource, logoDestination);
  if (availableQrTemplate) {
    await copyFile(availableQrTemplate, path.join(publicRoot, "documents", "test_metadatacamion.xlsx"));
  }

  // Each tenant's enterprise images live in their own subfolder — never the shared
  // default — so two tenants can't collide on a same-named file (e.g. company-a.png),
  // and the initializer's filename-without-extension lookup key stays untouched.
  const enterpriseSubdir = path.join("images", "enterprises", tenantName);
  const enterpriseDestination = path.join(publicRoot, enterpriseSubdir);
  const enterpriseImagesFolder = `public/${enterpriseSubdir.split(path.sep).join("/")}`;
  await fs.mkdir(enterpriseDestination, { recursive: true });
  await Promise.all(
    enterpriseImages.map((fileName) =>
      copyFile(path.join(enterprisesSource, fileName), path.join(enterpriseDestination, fileName)),
    ),
  );

  console.log(`Tenant assets installed: ${tenantName}`);
  console.log(`- Logo: ${path.relative(projectRoot, logoDestination)}`);
  console.log(`- Enterprise images: ${enterpriseImages.length} (${enterpriseImagesFolder})`);
  console.log(availableQrTemplate
    ? `- QR template: ${path.relative(projectRoot, path.join(publicRoot, "documents", "test_metadatacamion.xlsx"))}`
    : "- QR template: skipped; using the existing public template");

  if (startApp) {
    console.log(`Starting the app with NEXT_PUBLIC_TENANT=${tenantName}...`);
    const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
    const child = spawn(npmCommand, ["run", "dev"], {
      cwd: projectRoot,
      env: { ...process.env, NEXT_PUBLIC_TENANT: tenantName },
      stdio: "inherit",
    });
    await new Promise<void>((resolve) => {
      child.on("exit", (code, signal) => {
        if (signal) {
          process.kill(process.pid, signal);
          return;
        }
        process.exitCode = code ?? 1;
        resolve();
      });
    });
  } else {
    console.log("App start skipped (--no-start).");
    console.log(`Set NEXT_PUBLIC_TENANT=${tenantName} in the deployment environment.`);
  }
}

installTenantAssets().catch((error: unknown) => {
  console.error(`Tenant asset installation failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
