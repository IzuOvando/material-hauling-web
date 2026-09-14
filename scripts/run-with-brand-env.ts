import { promises as fs } from "fs";
import { spawn } from "child_process";
import path from "path";

function parseEnvFile(contents: string): Record<string, string> {
  const values: Record<string, string> = {};

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    const value = rawValue.trim();
    const isDoubleQuoted = value.startsWith('"') && value.endsWith('"');
    const isSingleQuoted = value.startsWith("'") && value.endsWith("'");

    values[key] = isDoubleQuoted || isSingleQuoted
      ? value.slice(1, -1)
      : value;
  }

  return values;
}

export async function loadEnvFile(filePath: string): Promise<Record<string, string>> {
  const contents = await fs.readFile(filePath, "utf8");
  return parseEnvFile(contents);
}

export async function startWithBrandEnv(
  brandEnvPath: string,
  command = "dev",
  args: string[] = [],
  computedOverrides: Record<string, string> = {},
): Promise<void> {
  const baseEnvPath = path.resolve(process.cwd(), ".env");

  const baseEnv = await loadEnvFile(baseEnvPath);
  const brandEnv = await loadEnvFile(brandEnvPath);
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

  console.log(`Using base environment: ${path.relative(process.cwd(), baseEnvPath)}`);
  console.log(`Applying brand overrides: ${path.relative(process.cwd(), brandEnvPath)}`);
  console.log(`Starting: npm run ${[command, ...args].join(" ")}`);

  const mergedEnv: Record<string, string | undefined> = {
    ...process.env,
    ...baseEnv,
    ...computedOverrides,
    ...brandEnv,
  };
  mergedEnv.NODE_ENV = process.env.NODE_ENV;

  const child = spawn(npmCommand, ["run", command, ...args], {
    cwd: process.cwd(),
    env: mergedEnv as NodeJS.ProcessEnv,
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
}

async function runWithBrandEnv(): Promise<void> {
  const [brandEnvArg, ...commandArgs] = process.argv.slice(2);
  const brandEnvPath = path.resolve(
    process.cwd(),
    brandEnvArg || ".env.whitelabel-demo",
  );
  const command = commandArgs[0] || "dev";
  const args = commandArgs.slice(1);

  await startWithBrandEnv(brandEnvPath, command, args);
}

if (require.main === module) {
  runWithBrandEnv().catch((error: unknown) => {
    console.error(`Brand environment runner failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
