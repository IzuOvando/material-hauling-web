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
