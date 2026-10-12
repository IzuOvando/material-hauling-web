/**
 * Runs every seed-*.js file in this directory (except seed-all.js which is legacy).
 *
 * Usage:
 *   node prisma/seeders/run-all.js            # run all seeders
 *   node prisma/seeders/run-all.js --assign   # forward flags to each seeder
 */
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const dir = __dirname;
const args = process.argv.slice(2).join(" ");

// Files with these keywords are skipped unless --all is passed
const SKIP_KEYWORDS = ["mock", "test", "platform"];
const includeAll = process.argv.includes("--all");

const files = fs
  .readdirSync(dir)
  .filter(
    (f) =>
      f.startsWith("seed-") &&
      f.endsWith(".js") &&
      f !== "seed-all.js" &&
      f !== "run-all.js" &&
      (includeAll || !SKIP_KEYWORDS.some((kw) => f.includes(kw)))
  )
  .sort();

console.log(`Found ${files.length} seeders:\n`);

for (const file of files) {
  const filePath = path.join(dir, file);
  console.log(`▶ Running ${file}...`);
  try {
    execSync(`node "${filePath}" ${args}`, { stdio: "inherit" });
    console.log(`✓ ${file} done\n`);
  } catch (e) {
    console.error(`✗ ${file} failed (exit code ${e.status})\n`);
    process.exit(e.status || 1);
  }
}

console.log("All seeders complete.");
