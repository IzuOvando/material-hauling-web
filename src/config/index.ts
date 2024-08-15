const CONFIG = {
  BASE_URL: process.env.BASE_URL || "http://localhost:3000",
  BATCHES_RECORDS: Number(process.env.BATCHES_RECORDS) || 5000,
  BATCHES_CSV_LINES: Number(process.env.BATCHES_CSV_LINES) || 10000,
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
  },
  PRINTERS_TIMEOUT: Number(process.env.PRINTERS_TIMEOUT) || 10000,
};

export default CONFIG;
