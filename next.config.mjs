import fs from "fs";
import path from "path";

const tenant = process.env.NEXT_PUBLIC_TENANT;
const tenantFile = tenant
  ? path.resolve("client-assets", tenant, "tenant.json")
  : path.resolve("src/config/tenant-empty.json");

if (tenant && !fs.existsSync(tenantFile)) {
  throw new Error(`NEXT_PUBLIC_TENANT="${tenant}" but ${tenantFile} does not exist`);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias["@tenant"] = tenantFile;
    // Webpack's persistent cache doesn't notice the alias target changing, so a build
    // made for one tenant would keep being served for another (or for no tenant).
    // Keying the cache on the tenant, and watching the tenant file, invalidates it.
    if (config.cache && typeof config.cache === "object") {
      config.cache.version = `${config.cache.version ?? ""}|tenant:${tenant ?? "default"}`;
      config.cache.buildDependencies = {
        ...config.cache.buildDependencies,
        tenant: [tenantFile],
      };
    }
    return config;
  },
  env: {
    BASE_URL: process.env.BASE_URL || "http://localhost:3000",
    BATCHES_RECORDS: process.env.BATCHES_RECORDS || 5000,
    BATCHES_CSV_LINES: process.env.BATCHES_CSV_LINES || 10000,
    PRINTERS_TIMEOUT: process.env.PRINTERS_TIMEOUT || 10000,
  },
};

export default nextConfig;
