import { promises as fs } from "fs";
import path from "path";
import { spawn } from "child_process";
import sharp from "sharp";

const projectRoot = process.cwd();
const scriptArgs = process.argv.slice(2);
const startApp = !scriptArgs.includes("--no-start");
const tenantName = scriptArgs.find((arg) => !arg.startsWith("--"));

const allowedImageExtensions = [".svg", ".png", ".jpg", ".jpeg", ".webp"];

// Every tenant logo is normalized to this reference's proportions (see normalizeLogo
// below), so any tenant's logo — any source size, shape, or format — renders in the
// same box as every other tenant, instead of looking bigger/smaller depending on its
// own aspect ratio.
const REFERENCE_LOGO_PATH = path.join(projectRoot, "public", "images", "logos", "logo_mexico.svg");
const NORMALIZED_LOGO_HEIGHT = 240;

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

async function findBrandingLogoSource(brandingDir: string): Promise<string> {
  for (const ext of allowedImageExtensions) {
    const candidate = await findOptionalFile(path.join(brandingDir, `logo${ext}`));
    if (candidate) return candidate;
  }
  throw new Error(
    `Missing branding logo: expected one of logo{${allowedImageExtensions.join(",")}} in ${path.relative(projectRoot, brandingDir)}`,
  );
}

async function getReferenceAspectRatio(): Promise<number> {
  const metadata = await sharp(REFERENCE_LOGO_PATH).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error(`Could not read dimensions of reference logo: ${path.relative(projectRoot, REFERENCE_LOGO_PATH)}`);
  }
  return metadata.width / metadata.height;
}

async function normalizeLogo(sourcePath: string, destinationPath: string): Promise<{ width: number; height: number }> {
  const aspectRatio = await getReferenceAspectRatio();
  const height = NORMALIZED_LOGO_HEIGHT;
  const width = Math.round(height * aspectRatio);

  const isSvg = path.extname(sourcePath).toLowerCase() === ".svg";
  const pipeline = isSvg ? sharp(sourcePath, { density: 300 }) : sharp(sourcePath);

  await fs.mkdir(path.dirname(destinationPath), { recursive: true });
  await pipeline
    .resize(width, height, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(destinationPath);

  return { width, height };
}

async function getEnterpriseImages(folder: string): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(folder, { withFileTypes: true });
  } catch {
    throw new Error(`Missing enterprise images folder: ${path.relative(projectRoot, folder)}`);
  }

  const allowed = new Set(allowedImageExtensions);
  const images = entries
    .filter((entry) => entry.isFile() && allowed.has(path.extname(entry.name).toLowerCase()))
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
  const brandingDir = path.join(sourceRoot, "branding");
  const enterprisesSource = path.join(sourceRoot, "enterprises");
  const qrTemplateSource = path.join(sourceRoot, "documents", "qr-template.xlsx");

  const brandingSource = await findBrandingLogoSource(brandingDir);
  await ensureFile(path.join(sourceRoot, "tenant.json"), "tenant config");
  const availableQrTemplate = await findOptionalFile(qrTemplateSource);
  const enterpriseImages = await getEnterpriseImages(enterprisesSource);

  // Normalized into tenant-assets/, not public/: the app reads it at build time via
  // the @tenant-logo webpack alias (next.config.mjs), not as a runtime URL.
  const normalizedLogoPath = path.join(brandingDir, "logo.normalized.png");
  const { width, height } = await normalizeLogo(brandingSource, normalizedLogoPath);

  const publicRoot = path.join(projectRoot, "public");
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
  console.log(
    `- Logo: ${path.relative(projectRoot, brandingSource)} normalized to ${width}x${height}px (matches the default logo's proportions) → ${path.relative(projectRoot, normalizedLogoPath)}`,
  );
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
