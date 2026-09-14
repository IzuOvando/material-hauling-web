import { promises as fs } from "fs";
import path from "path";
import { startWithBrandEnv } from "./run-with-brand-env";

const projectRoot = process.cwd();
const scriptArgs = process.argv.slice(2);
const startApp = !scriptArgs.includes("--no-start");
const clientName = scriptArgs.find((arg) => !arg.startsWith("--"));

const allowedImageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg"]);

function printUsage(): void {
  console.error("Usage: npm run client:install -- <client-folder>");
  console.error("Example: npm run client:install -- atlas");
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

async function installClientAssets(): Promise<void> {
  if (!clientName || clientName.includes("/") || clientName.includes("\\") || clientName === "." || clientName === "..") {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const sourceRoot = path.join(projectRoot, "client-assets", clientName);
  const brandingSource = path.join(sourceRoot, "branding", "logo.svg");
  const enterprisesSource = path.join(sourceRoot, "enterprises");
  const qrTemplateSource = path.join(sourceRoot, "documents", "qr-template.xlsx");

  await ensureFile(brandingSource, "branding logo");
  const availableQrTemplate = await findOptionalFile(qrTemplateSource);
  const enterpriseImages = await getEnterpriseImages(enterprisesSource);

  const publicRoot = path.join(projectRoot, "public");
  // The default logo (logo_mexico.svg) is never overwritten — each client gets its own
  // file so the repository default always stays available as a fallback.
  const logoFileName = `logo-${clientName}.svg`;
  const logoDestination = path.join(publicRoot, "images", "logos", logoFileName);
  const logoPublicPath = `/images/logos/${logoFileName}`;
  await copyFile(brandingSource, logoDestination);
  if (availableQrTemplate) {
    await copyFile(availableQrTemplate, path.join(publicRoot, "documents", "test_metadatacamion.xlsx"));
  }

  const enterpriseDestination = path.join(publicRoot, "images", "enterprises");
  await fs.mkdir(enterpriseDestination, { recursive: true });
  await Promise.all(
    enterpriseImages.map((fileName) =>
      copyFile(path.join(enterprisesSource, fileName), path.join(enterpriseDestination, fileName)),
    ),
  );

  console.log(`Client assets installed: ${clientName}`);
  console.log(`- Logo: ${path.relative(projectRoot, logoDestination)} (NEXT_PUBLIC_LOGO_URL=${logoPublicPath})`);
  console.log(`- Enterprise images: ${enterpriseImages.length}`);
  console.log(availableQrTemplate
    ? `- QR template: ${path.relative(projectRoot, path.join(publicRoot, "documents", "test_metadatacamion.xlsx"))}`
    : "- QR template: skipped; using the existing public template");

  if (startApp) {
    const brandEnvSource = await findOptionalFile(path.join(sourceRoot, "brand.env"));
    const envPath = brandEnvSource ?? path.join(projectRoot, ".env");
    console.log("Starting the app with the base environment and client overrides...");
    await startWithBrandEnv(envPath, "dev", [], { NEXT_PUBLIC_LOGO_URL: logoPublicPath });
  } else {
    console.log("App start skipped (--no-start).");
    console.log(`Set NEXT_PUBLIC_LOGO_URL=${logoPublicPath} in the client's brand.env or deployment environment.`);
  }
}

installClientAssets().catch((error: unknown) => {
  console.error(`Client asset installation failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
