/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    BASE_URL: process.env.BASE_URL || "http://localhost:3000",
    BATCHES_RECORDS: process.env.BATCHES_RECORDS || 5000,
    BATCHES_CSV_LINES: process.env.BATCHES_CSV_LINES || 10000,
    PRINTERS_TIMEOUT: process.env.PRINTERS_TIMEOUT || 10000,
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  },
};

export default nextConfig;
